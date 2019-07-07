export interface YtPageInfo {
    totalResults: number;
    resultsPerPage: number;
}

export interface YtFindItemVideoId {
    kind: string;
    videoId: string;
}

export interface YtFindVideoItem {
    kind: string;
    etag: string;
    id: YtFindItemVideoId;
}

export interface YtFindVideoResponse {
    kind: string;
    etag: string;
    nextPageToken: string;
    regionCode: string;
    pageInfo: YtPageInfo;
    items: [YtFindVideoItem] | [];
}