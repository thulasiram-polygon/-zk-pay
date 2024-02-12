include 'payment-amount-verifyer.circom';
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/smt/smtprocessor.circom";

template PaymentProcesser(nLevels) {

    signal input userID;
    signal input views;
    signal input secret;
    signal input paymentAmount;
    signal input userOldTxNonce;
    signal input siblings[nLevels];
    signal input oldTxHash;
    signal input oldRoot;
    signal input newRoot;

    component paymentAmountChecker = PaymentAmountVerifyer();
    paymentAmountChecker.views <== views;
    paymentAmountChecker.secret <== secret;

    // check if the amount is correct
    paymentAmount === paymentAmountChecker.out;

    // Verify create SMT tree
    component smtprocessor = SMTProcessor(nLevels);
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== paymentAmount;
    poseidon.inputs[1] <== userOldTxNonce + 1;
    
    // log("newTxHash", poseidon.out);

    smtprocessor.fnc[0] <== 0;
    smtprocessor.fnc[1] <== 1;
    smtprocessor.oldRoot <== oldRoot;
    smtprocessor.siblings <== siblings;
    smtprocessor.oldKey <== userID;
    smtprocessor.oldValue <== oldTxHash;
    smtprocessor.isOld0 <== 0;
    smtprocessor.newKey <== userID;
    smtprocessor.newValue <== poseidon.out;
    
    // Checks if the new root is correctly calculated
    // and transaction is included in the new root
    newRoot === smtprocessor.newRoot;
    

}

component main {public [userID, views, userOldTxNonce, oldRoot ]} = PaymentProcesser(10);