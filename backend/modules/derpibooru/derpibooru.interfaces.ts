export interface DerpibooruImgReprs {
    thumbTiny: string;
    thumbSmall: string;
    thumb: string;
    small: string;
    medium: string;
    large: string;
    tall: string;
    full: string;
}

export interface DerpibooruImg {
    id: number;
    createdAt: string;
    updatedAt: string;
    firstSeenAt: string;
    score: number;
    commentCount: number;
    width: number;
    height: number;
    fileName: string;
    description: string;
    uploader: string;
    uploaderId: number;
    image: string;
    upvotes: number;
    downvotes: number;
    faves: number;
    tags: string;
    tagIds: number[];
    aspectRatio: number;
    originalFormat: string;
    mimeType: string;
    sha512Hash: string;
    origSha512Hash: string;
    sourceUrl: string;
    representations: DerpibooruImgReprs;
    isRendered: boolean;
    isOptimized: boolean;
    interactions: unknown[];
    spoilered: boolean;
}