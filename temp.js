
pragma circom 2.1.6;

include "circomlib/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/smt/smtprocessor.circom";

// amount = views * secret * 1/1000

template PaymentAmountVerifyer () {

    signal input views;
    signal input secret;
    signal inv_denominator;
    signal secret_mul_denom;
    signal output out;
    
    var denominator = 1000;
    //Make sure the secret is more then 0 
    assert(secret > 0);

    // To prevent underflow
    assert(views > 1000);

    inv_denominator <-- 1/denominator;
    
    component eq = IsEqual();
    eq.in[0] <== 1;
    eq.in[1] <== inv_denominator * denominator;
    
    secret_mul_denom <== secret * inv_denominator;
    out <== secret_mul_denom * views;

    log("amount", out);
}

// component main { public [ views ] } = PaymentAmountVerifyer();



template PaymentProcesser(nLevels) {

    signal input userID;
    signal input views;
    signal input secret;
    signal input paymentAmount;
    signal input userTxNonce;
    signal input siblings[nLevels];
    signal input oldRoot;
    signal input newRoot;

    component paymentAmountChecker = PaymentAmountVerifyer();
    paymentAmountChecker.views <== views;
    paymentAmountChecker.secret <== secret;
    // check if the amount is correct
    paymentAmount === paymentAmountChecker.out;

    // Verify create SMT tree

    

}

component main {public [userID, views, userTxNonce ]} = PaymentProcesser(10);




/* INPUT = {
  "userID": "1",
  "views": "100000",
  "secret": "1",
  "paymentAmount": "100",
  "userTxNonce": 1,
 "siblings": [
    "8793755720050879226771079550273920346575490519485480360057320776748751995312",
    "4614562799285771622253692789299102286469136375176734148219233637572331251713",
    "8737693575479231375633156777717223879191424190632813711879081608418606336178",
    "0",
    "0",
    "0",
    "0",
    "0",
    "0",
    "0"
  ],
  "oldRoot": "8737693575479231375633156777717223879191424190632813711879081608418606336178",
  "newRoot": "10788938711510615560157397621108027764395491374337063858146968106623400911200"
} */

