/**
 * @fileoverview test.js
 * @description This file contains the tests for the application.
 * TODO: 1. Create a circute that can accept userID and views as public inputs and SECRET as private input.
 * and return the result of the computation.
 * Result = (views * SECRET)/1000
 */

// Initialize the userBalance Trie with the initial balance "0" for all the users.
// For the simplicity of the test, we are using userIDs as the keys and their balance as the value.
// Ex: 1: 0, 2: 0, 3: 0, 4: 0, 5: 0

// Each User will have a mapping of their id and root of the merkle tree.
// mapping (userID => root);
// mapping (userID => nonce);
// SMT will be used to verify the root and nonce of the user.
// For balance SMT =  userNonce  => userBalance with creation proof
// Event(userID, root, nonce, timestamp) will be emitted when the user is registered.
const { newMemEmptyTrie, buildPoseidon } = require("circomlibjs");
const { randomBytes } = require("crypto");
const { assert } = require("chai");
const { wasm } = require("circom_tester");
const path = require("path");
const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");
const { BigNumber } = require("@ethersproject/bignumber");
const { createHash } = require("crypto");
const Logger = require("logplease");

const fs = require("fs");
const FIELD_SIZE = BigNumber.from(
	"21888242871839275222246405745257275088548364400416034343698204186575808495617",
);
const logger = Logger.create("test-zk-evm", { color: Logger.Colors.Yellow });
Logger.setLogLevel(Logger.LogLevels.DEBUG);

// For storing users previous txn hash;
let oldTxHashMapping = {};

describe("Anonimus Payment Verifier", function () {
	// Create few users with IDs
	let userIDs;
	let userStateTrie;
	let poseidon;

	let PaymentAmountVerifier;
	let PaymentProcessor;

	const convertSiblings = (siblings) => {
		let result = [];
		for (let i = 0; i < siblings.length; i++)
			result.push(userStateTrie.F.toObject(siblings[i]));
		while (result.length < 10) result.push(0);
		return result;
	};

	const buffer2hex = (buff) => {
		return BigNumber.from(buff).toHexString();
	};

	const numToBuffer = (num) => {
		let hex = BigNumber.from(num).toBigInt().toString(16);
		while (hex.length < 64) hex = "0" + hex;
		return Buffer.from(hex, "hex");
	};

	const calculatePaymentAmount = (views, secret) => {
		return (views * secret) / 1000;
	};

	const createPaymentTransferRequest = async (
		userID,
		views,
		secret,
		userOldTxNonce,
		oldTxHash,
	) => {
		// console.log(userID, views, secret, userNonce);
		const paymentAmount = calculatePaymentAmount(views, secret);
		const oldRoot = userStateTrie.F.toObject(userStateTrie.root);
		//create a poseidon hash of the paymentAmount and userNonce
		//@dev: note that userNonce is incremented by 1.
		const paymenAndNonceHash = poseidon([paymentAmount, userOldTxNonce + 1]);

		//console.log("newTxHash", poseidon.F.toObject(paymenAndNonceHash));
		// update the user Trie with the new paymentAndNonceHash
		const res = await userStateTrie.update(
			userID,
			poseidon.F.toObject(paymenAndNonceHash),
		);
		const newRoot = userStateTrie.F.toObject(userStateTrie.root);
		const siblings = convertSiblings(res.siblings);

		const input = {
			userID,
			views,
			secret,
			paymentAmount,
			userOldTxNonce,
			oldTxHash,
			siblings,
			oldRoot,
			newRoot,
		};

		console.log("input", input);
		return input;
	};

	before(async () => {
		poseidon = await buildPoseidon();
		userStateTrie = await newMemEmptyTrie();

		// Create few users with IDs like 1, 2, 3, 4, 5
		userIDs = [0, 1, 2, 3, 4, 5];
	});

	// Initiate the userStateTrie with the initial balance "0" for all the users.
	//@dev: User State Trie keys are userIDs(0,1,2,3,4) and values are balance.
	it("should initiate userStateTrie with 0 balance", async () => {
		for (let i = 0; i < userIDs.length; i++) {
			const zeroHash = poseidon.F.toObject(poseidon([0, 0]));

			await userStateTrie.insert(userIDs[i], zeroHash);
			oldTxHashMapping[userIDs[i]] = zeroHash;
		}
	});

	// Initiate user Payment Transaction
	//@dev: Admin will initiate the payment transaction by providing user's userID, views and secret.
	it("should initiate payment transaction", async () => {
		const userID = 1;
		const views = 100000;
		const secret = 1;
		const userOldTxNonce = 0;
		const oldTxHash = oldTxHashMapping[userID];
		const result = await createPaymentTransferRequest(
			userID,
			views,
			secret,
			userOldTxNonce,
			oldTxHash,
		);
	});
});

/* INPUT = {
  "userID": 1,
  "views": 100000,
  "secret": 1,
  "userOldTxNonce": 0,
  "paymentAmount": 100,
  "oldTxHash": 14744269619966411208579211824598458697587494354926760081771325075741142829156,
  "siblings": [
    8793755720050879226771079550273920346575490519485480360057320776748751995312,
    4614562799285771622253692789299102286469136375176734148219233637572331251713,
    8737693575479231375633156777717223879191424190632813711879081608418606336178,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  "oldRoot": 8737693575479231375633156777717223879191424190632813711879081608418606336178,
  "newRoot": 10788938711510615560157397621108027764395491374337063858146968106623400911200
} */
