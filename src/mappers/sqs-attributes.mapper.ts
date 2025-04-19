import { MessageAttributeValue } from "@aws-sdk/client-sqs";
import { SqsDataType } from "../data/types";
import { SqsMessageAttributesRequest } from "../request/sqs-message-attributes.request";

export function mapAttributes(attributes: SqsMessageAttributesRequest) {

    var messageAttributes: { [key: string]: MessageAttributeValue } = {};
    for (let [key, value] of Object.entries(attributes)) {
        messageAttributes[key] = {
            DataType: detectSqsDataType(value),
            StringValue: value.toString()
        }
    }

    return messageAttributes;
}

function detectSqsDataType(value: unknown): SqsDataType {
    if (typeof value === "number" || (!isNaN(Number(value)) && typeof value !== "boolean")) {
        return "Number"
    }

    if (typeof value === "string") {
        return "String"
    }

    if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
        return "Binary"
    }

    // Por defecto, lo tratamos como String
    return "String"
}