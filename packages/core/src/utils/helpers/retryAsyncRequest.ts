interface RetryAsyncRequestParams<T> {
    run(): Promise<T>;
    retries?: number;
    notifySuccess?(data: T, retries: number): void;
    notifyError?(error: unknown, retries: number): void;
}

export async function retryAsyncRequest<T>(params: RetryAsyncRequestParams<T>): Promise<T> {
    const { run, retries = 1, notifyError, notifySuccess } = params;
    let lastValue: T | null = null;
    let lastError: unknown = null;

    for (let i = 1; i <= retries; i++) {
        try {
            const data = await run();
            lastValue = data;
            lastError = null;

            notifySuccess?.(data, i);

            break;
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError === null) {
        return lastValue as T;
    }

    notifyError?.(lastError, retries);

    throw lastError;
}
