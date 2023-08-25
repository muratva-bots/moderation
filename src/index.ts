import { Client } from '@/structures';
import mongoose from 'mongoose';

const client = new Client();
mongoose.set('strictQuery', false);

client.connect();

process.on("uncaughtException", (err) => {
	const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
	console.error("[ERROR]:", errorMsg);
});

process.on('unhandledRejection', (error: Error) => console.log(`[ERROR]: ${error.name}: ${error.message}`));
