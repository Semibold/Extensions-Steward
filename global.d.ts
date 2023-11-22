interface KeywordSearchSchema {
    type: "keywordSearch";
    input: string;
}

/**
 * Union type of schema
 */
declare type RuntimeMessageSchema = KeywordSearchSchema;
