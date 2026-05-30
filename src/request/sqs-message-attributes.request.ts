export type SqsMessageAttributeValue =
    | string
    | number
    | boolean
    | Uint8Array
    | ArrayBuffer
    | null
    | undefined;

export interface SqsMessageAttributesRequest {
    [key: string]: SqsMessageAttributeValue;
}
