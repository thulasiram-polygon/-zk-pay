#!/user/bin/env bash

# use `node --max-old-space-size=8192 node_modules/.bin/snarkjs` if the process dies because of out of memory

mkdir -p build
wget -nc https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_22.ptau -P ./build
[ ! -f ./build/verify-transfer-req-test.r1cs ] && circom test/circuits/verify-transfer-req-test.circom --wasm --r1cs -o ./build
[ ! -f ./build/verify-transfer-req-test.zkey ] && npx snarkjs groth16 setup build/verify-transfer-req-test.r1cs build/powersOfTau28_hez_final_22.ptau build/verify-transfer-req-test.zkey
[ ! -f ./build/verify-transfer-req-test_vkey.json ] && npx snarkjs zkey export verificationkey build/verify-transfer-req-test.zkey build/verify-transfer-req-test_vkey.json
[ ! -f ./build/zkevm-tx-test.r1cs ] && circom test/circuits/zkevm-tx-test.circom --wasm --r1cs -o ./build
[ ! -f ./build/zkevm-tx-test.zkey ] && npx snarkjs groth16 setup build/zkevm-tx-test.r1cs build/powersOfTau28_hez_final_22.ptau build/zkevm-tx-test.zkey
[ ! -f ./build/zkevm-tx-test_vkey.json ] && npx snarkjs zkey export verificationkey build/zkevm-tx-test.zkey build/zkevm-tx-test_vkey.json
[ ! -f ./build/zk-evm.r1cs ] && circom circuits/zk-evm.circom --wasm --r1cs -o ./build
[ ! -f ./build/zk-evm.zkey ] && npx snarkjs groth16 setup build/zk-evm.r1cs build/powersOfTau28_hez_final_22.ptau build/zk-evm.zkey
[ ! -f ./build/zk-evm_vkey.json ] && npx snarkjs zkey export verificationkey build/zk-evm.zkey build/zk-evm_vkey.json
[ ! -f ./contracts/ZKEVMVerifier.sol ] && npx snarkjs zkey export solidityverifier build/zk-evm.zkey contracts/ZKEVMVerifier.sol
sed -i -e 's/contract Groth16Verifier/contract ZKEVMVerifier/g' contracts/ZKEVMVerifier.sol
exit 0