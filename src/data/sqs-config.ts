import { SqsCredentials } from "./sqs-credentials";

export class SqsConfig {
    region!: string;
    credentials!: SqsCredentials;
}