import json, hashlib, pathlib
import pytest
C=json.loads(pathlib.Path('fixtures/claim.json').read_text())
R=json.loads(pathlib.Path('fixtures/response.json').read_text())

def answer(states=None):
    states=states or [('YES','YES','YES','YES'),('NO','NO','NO','YES')]
    return json.dumps({'findings':[dict(id=d['id'],**dict(zip(('lease_allows','beyond_wear','attributable','cost_supported'),s)),lease_quote=C['lease'],evidence_quote=d['evidence'],tenant_quote=R['statement'],reason='Grounded in the submitted synthetic records.') for d,s in zip(C['deductions'],states)],'reason':'The shelf repair is supported; pre-existing scuffs are excluded.'})

@pytest.fixture
def contract(direct_deploy):
    return direct_deploy('contracts/deposit_fair.py',sdk_version='v0.2.16')

def setup_case(c,vm,bob,response=None):
    c.open_case('demo',str(bob),json.dumps(C))
    with vm.prank(bob): c.respond('demo',json.dumps(response or R))

@pytest.mark.parametrize('states,outcome,total',[
([('YES',)*4,('NO','NO','NO','YES')],'PARTIALLY_SUPPORTED',8000),
([('YES',)*4,('YES',)*4],'DEDUCTIONS_SUPPORTED',20000),
([('NO',)*4,('NO',)*4],'DEDUCTIONS_UNSUPPORTED',0),
([('UNCERTAIN',)*4,('NO',)*4],'INCONCLUSIVE',0)])
def test_outcomes(contract,direct_vm,direct_bob,states,outcome,total):
    setup_case(contract,direct_vm,direct_bob)
    direct_vm.mock_llm('.*',answer(states));contract.evaluate('demo')
    a=json.loads(contract.get_receipt('demo',1))['assessment']
    assert a['outcome']==outcome and a['supported_minor']==total
    assert sum(a[k] for k in ('supported_minor','unsupported_minor','unresolved_minor'))==20000
    assert direct_vm.run_validator()

def test_independent_validator(contract,direct_vm,direct_bob):
    setup_case(contract,direct_vm,direct_bob);direct_vm.mock_llm('.*',answer());contract.evaluate('demo')
    direct_vm.clear_mocks();direct_vm.mock_llm('.*',answer([('NO',)*4,('NO',)*4]))
    assert not direct_vm.run_validator()

@pytest.mark.parametrize('bad',['{}','null','not json',answer().replace('shelf','FAKE'),answer().replace('YES','MAYBE'),answer().replace(C['lease'],'fabricated')])
def test_fail_closed(contract,direct_vm,direct_bob,bad):
    setup_case(contract,direct_vm,direct_bob);direct_vm.mock_llm('.*',bad);contract.evaluate('demo')
    a=json.loads(contract.get_receipt('demo',1))['assessment']
    assert a['outcome']=='INCONCLUSIVE' and a['unresolved_minor']==20000
    assert direct_vm.run_validator()

def test_no_unilateral_assessment(contract):
    contract.open_case('demo','0x'+'1'*40,json.dumps(C))
    with pytest.raises(Exception,match='not ready'):contract.evaluate('demo')

def test_terms_disputed(contract,direct_vm,direct_bob):
    setup_case(contract,direct_vm,direct_bob,dict(R,agrees_terms=False));contract.evaluate('demo')
    a=json.loads(contract.get_receipt('demo',1))['assessment']
    assert a['reason']=='LEASE_TERMS_DISPUTED' and a['unresolved_minor']==20000

def test_authorization(contract,direct_vm,direct_bob,direct_charlie):
    setup_case(contract,direct_vm,direct_bob)
    with direct_vm.prank(direct_charlie):
        for action in (lambda:contract.evaluate('demo'),lambda:contract.challenge('demo','more')):
            with pytest.raises(Exception,match='Only case parties'):action()
    with pytest.raises(Exception,match='invited tenant'):contract.respond('demo',json.dumps(R))

def test_challenge_history(contract,direct_vm,direct_bob):
    setup_case(contract,direct_vm,direct_bob);direct_vm.mock_llm('.*',answer());contract.evaluate('demo')
    first=contract.get_receipt('demo',1)
    with direct_vm.prank(direct_bob):contract.challenge('demo','Synthetic challenge: please recheck the same invoice.')
    contract.evaluate('demo');second=json.loads(contract.get_receipt('demo',2))
    assert contract.get_receipt('demo',1)==first
    assert second['previous_hash']==json.loads(first)['decision_hash']
    assert second['evidence_hash']!=json.loads(first)['evidence_hash']
    h=second.pop('decision_hash')
    assert h==hashlib.sha256(json.dumps(second,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()).hexdigest()
    with pytest.raises(Exception):contract.challenge('demo','third')
    with pytest.raises(Exception):contract.evaluate('demo')

@pytest.mark.parametrize('mutate',[lambda c:c.update(deposit_minor=True),lambda c:c.update(deposit_minor=-1),lambda c:c.update(currency='FAKE'),lambda c:c.update(deductions=[]),lambda c:c['deductions'][0].update(amount_minor=9999999),lambda c:c.update(extra=1),lambda c:c.update(lease=''),lambda c:c['deductions'].append(c['deductions'][0]),lambda c:c.update(inspection='x'*6001)])
def test_invalid_claim(contract,mutate):
    c=json.loads(json.dumps(C));mutate(c)
    with pytest.raises(Exception):contract.open_case('demo','0x'+'1'*40,json.dumps(c))

@pytest.mark.parametrize('tenant',['bad','0x'+'0'*40,'0x'+'z'*40])
def test_bad_tenant(contract,tenant):
    with pytest.raises(Exception):contract.open_case('demo',tenant,json.dumps(C))

def test_self_tenant(contract,direct_vm,direct_alice):
    with direct_vm.prank(direct_alice):
        with pytest.raises(Exception):contract.open_case('demo',str(direct_alice),json.dumps(C))

def test_immutable(contract,direct_vm,direct_bob):
    setup_case(contract,direct_vm,direct_bob)
    with pytest.raises(Exception):contract.open_case('demo',str(direct_bob),json.dumps(C))
    with direct_vm.prank(direct_bob):
        with pytest.raises(Exception):contract.respond('demo',json.dumps(R))
    assert contract.list_cases(0,1)==['demo']
    assert contract.list_cases(1,1)==[]
    with pytest.raises(Exception):contract.list_cases(-1,10)

def test_forged_leader(contract,direct_vm,direct_bob):
    setup_case(contract,direct_vm,direct_bob);direct_vm.mock_llm('.*',answer());contract.evaluate('demo')
    a=json.loads(contract.get_receipt('demo',1))['assessment'];a['supported_minor']=99999
    assert not direct_vm.run_validator(leader_result=a)
    assert not direct_vm.run_validator(leader_error=Exception('leader failed'))


def test_duplicate_json_keys(contract):
    raw=json.dumps(C).replace('"title":','"title":"earlier", "title":')
    with pytest.raises(Exception,match='Duplicate JSON key'):contract.open_case('dup','0x'+'1'*40,raw)

def test_irrelevant_model_extras_never_control_amounts(contract,direct_vm,direct_bob):
    setup_case(contract,direct_vm,direct_bob)
    a=json.loads(answer());a['outcome']='DEDUCTIONS_SUPPORTED';a['supported_minor']=999999
    a['findings'][0]['amount_minor']=999999;a['findings'][0]['state']='UNSUPPORTED'
    direct_vm.mock_llm('.*',json.dumps(a));contract.evaluate('demo')
    r=json.loads(contract.get_receipt('demo',1))['assessment']
    assert r['outcome']=='PARTIALLY_SUPPORTED' and r['supported_minor']==8000
    assert r['findings'][1]['amount_minor']==8000
    assert direct_vm.run_validator()

def test_validators_agree_on_item_verdict_not_irrelevant_subchecks(contract,direct_vm,direct_bob):
    setup_case(contract,direct_vm,direct_bob);direct_vm.mock_llm('.*',answer());contract.evaluate('demo')
    direct_vm.clear_mocks();direct_vm.mock_llm('.*',answer([('YES',)*4,('NO','NO','NO','UNCERTAIN')]))
    assert direct_vm.run_validator()

def test_unknown_cannot_override_a_definite_exclusion(contract,direct_vm,direct_bob):
    setup_case(contract,direct_vm,direct_bob)
    direct_vm.mock_llm('.*',answer([('YES',)*4,('NO','UNCERTAIN','UNCERTAIN','UNCERTAIN')]))
    contract.evaluate('demo');r=json.loads(contract.get_receipt('demo',1))['assessment']
    assert r['outcome']=='PARTIALLY_SUPPORTED' and r['unsupported_minor']==12000
