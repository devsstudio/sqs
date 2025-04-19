import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { SqsConfig } from "../data/sqs-config";
import { SqsMessageAttributesRequest } from "../request/sqs-message-attributes.request";
import { mapAttributes } from "../mappers/sqs-attributes.mapper";

export class SqsService {

    protected sqsClient: SQSClient;

    constructor(private readonly config: SqsConfig = null) {
        this.sqsClient = new SQSClient(config || {});
    }

    async sendFIFOMessage(uniqueId: string, url: string, groupId: string, attributes: SqsMessageAttributesRequest, body: any): Promise<void> {

        var sqsCommand = new SendMessageCommand({
            // Remove DelaySeconds parameter and value for FIFO queues
            // DelaySeconds: 10,
            MessageAttributes: mapAttributes(attributes),
            MessageBody: JSON.stringify(body, null, 4),
            MessageDeduplicationId: uniqueId, // Required for FIFO queues
            MessageGroupId: groupId, // Required for FIFO queues
            QueueUrl: url
        });

        try {
            await this.sqsClient.send(sqsCommand);
        } catch (e) {
            console.log("Error processing: " + uniqueId, e);
        }
    }

    async sendSimpleMessage(url: string, attributes: SqsMessageAttributesRequest, body: any, delaySeconds: number): Promise<void> {

        var sqsCommand = new SendMessageCommand({
            // Remove DelaySeconds parameter and value for FIFO queues
            DelaySeconds: delaySeconds,
            MessageAttributes: mapAttributes(attributes),
            MessageBody: JSON.stringify(body, null, 4),
            QueueUrl: url
        });

        try {
            await this.sqsClient.send(sqsCommand);
        } catch (e) {
            console.log("Error processing message ");
        }
    }
}
