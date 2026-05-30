import { SendMessageBatchCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { SqsConfig } from "../data/sqs-config";
import { SqsMessageAttributesRequest } from "../request/sqs-message-attributes.request";
import { mapAttributes } from "../mappers/sqs-attributes.mapper";

export class SqsService {

    protected sqsClient: SQSClient;

    constructor(private readonly config: SqsConfig | null = null) {
        this.sqsClient = new SQSClient(config || {});
    }

    private chunkArray<T>(items: T[], chunkSize: number): T[][] {
        if (chunkSize <= 0) {
            return [items];
        }

        const chunks: T[][] = [];
        for (let i = 0; i < items.length; i += chunkSize) {
            chunks.push(items.slice(i, i + chunkSize));
        }
        return chunks;
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

    async sendFIFOMessageBatch(
        url: string,
        messages: Array<{
            id: string;
            deduplicationId: string;
            groupId: string;
            attributes: SqsMessageAttributesRequest;
            body: any;
        }>
    ): Promise<void> {
        const batches = this.chunkArray(messages, 10);

        for (const batch of batches) {
            const sqsCommand = new SendMessageBatchCommand({
                QueueUrl: url,
                Entries: batch.map((m) => ({
                    Id: m.id,
                    MessageAttributes: mapAttributes(m.attributes),
                    MessageBody: JSON.stringify(m.body, null, 4),
                    MessageDeduplicationId: m.deduplicationId,
                    MessageGroupId: m.groupId,
                })),
            });

            try {
                const result = await this.sqsClient.send(sqsCommand);
                if (result.Failed && result.Failed.length > 0) {
                    console.log("Error processing FIFO batch messages", result.Failed);
                }
            } catch (e) {
                console.log("Error processing FIFO batch messages", e);
            }
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
            console.log("Error processing message ", e);
        }
    }

    async sendSimpleMessageBatch(
        url: string,
        messages: Array<{
            id: string;
            attributes: SqsMessageAttributesRequest;
            body: any;
            delaySeconds: number;
        }>
    ): Promise<void> {
        const batches = this.chunkArray(messages, 10);

        for (const batch of batches) {
            const sqsCommand = new SendMessageBatchCommand({
                QueueUrl: url,
                Entries: batch.map((m) => ({
                    Id: m.id,
                    DelaySeconds: m.delaySeconds,
                    MessageAttributes: mapAttributes(m.attributes),
                    MessageBody: JSON.stringify(m.body, null, 4),
                })),
            });

            try {
                const result = await this.sqsClient.send(sqsCommand);
                if (result.Failed && result.Failed.length > 0) {
                    console.log("Error processing batch messages", result.Failed);
                }
            } catch (e) {
                console.log("Error processing batch messages", e);
            }
        }
    }
}
