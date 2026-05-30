import { MessageAttributeValue } from "@aws-sdk/client-sqs";
import { SqsDataType } from "../data/types";
import { SqsMessageAttributesRequest } from "../request/sqs-message-attributes.request";

export function mapAttributes(attributes: SqsMessageAttributesRequest) {

    var messageAttributes: { [key: string]: MessageAttributeValue } = {};
    for (let [key, value] of Object.entries(attributes || {})) {
        if (value === undefined || value === null) {
            continue;
        }

        const dataType = detectSqsDataType(value);

        if (dataType === "Binary") {
            const binaryValue = value instanceof Uint8Array
                ? value
                : value instanceof ArrayBuffer
                    ? new Uint8Array(value)
                    : undefined;

            if (!binaryValue || binaryValue.byteLength === 0) {
                continue;
            }

            messageAttributes[key] = {
                DataType: "Binary",
                BinaryValue: binaryValue,
            };
            continue;
        }

        if (dataType === "Number") {
            const raw = typeof value === "number" ? value : Number(String(value).trim());
            if (!Number.isFinite(raw)) {
                continue;
            }

            messageAttributes[key] = {
                DataType: "Number",
                StringValue: String(raw),
            };
            continue;
        }

        const stringValue = String(value);
        if (stringValue.trim().length === 0) {
            continue;
        }

        messageAttributes[key] = {
            DataType: "String",
            StringValue: stringValue,
        };
    }

    return messageAttributes;
}

function detectSqsDataType(value: unknown): SqsDataType {
    if (typeof value === "number") {
        return "Number"
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return "String";
        }

        if (!isNaN(Number(trimmed))) {
            return "Number";
        }

        return "String";
    }

    if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
        return "Binary"
    }

    // Por defecto, lo tratamos como String
    return "String"
}