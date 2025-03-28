declare module 'file-system-cache' {
    type HashAlgorithm =
        | 'RSA-MD5'
        | 'RSA-RIPEMD160'
        | 'RSA-SHA1'
        | 'RSA-SHA1-2'
        | 'RSA-SHA224'
        | 'RSA-SHA256'
        | 'RSA-SHA3-224'
        | 'RSA-SHA3-256'
        | 'RSA-SHA3-384'
        | 'RSA-SHA3-512'
        | 'RSA-SHA384'
        | 'RSA-SHA512'
        | 'RSA-SHA512/224'
        | 'RSA-SHA512/256'
        | 'RSA-SM3'
        | 'blake2b512'
        | 'blake2s256'
        | 'id-rsassa-pkcs1-v1_5-with-sha3-224'
        | 'id-rsassa-pkcs1-v1_5-with-sha3-256'
        | 'id-rsassa-pkcs1-v1_5-with-sha3-384'
        | 'id-rsassa-pkcs1-v1_5-with-sha3-512'
        | 'md5'
        | 'md5-sha1'
        | 'md5WithRSAEncryption'
        | 'ripemd'
        | 'ripemd160'
        | 'ripemd160WithRSA'
        | 'rmd160'
        | 'sha1'
        | 'sha1WithRSAEncryption'
        | 'sha224'
        | 'sha224WithRSAEncryption'
        | 'sha256'
        | 'sha256WithRSAEncryption'
        | 'sha3-224'
        | 'sha3-256'
        | 'sha3-384'
        | 'sha3-512'
        | 'sha384'
        | 'sha384WithRSAEncryption'
        | 'sha512'
        | 'sha512-224'
        | 'sha512-224WithRSAEncryption'
        | 'sha512-256'
        | 'sha512-256WithRSAEncryption'
        | 'sha512WithRSAEncryption'
        | 'shake128'
        | 'shake256'
        | 'sm3'
        | 'sm3WithRSAEncryption'
        | 'ssl3-md5'
        | 'ssl3-sha1';

    type FileSystemCacheOptions = {
        basePath?: string;
        ns?: unknown;
        ttl?: number;
        hash?: HashAlgorithm;
        extension?: string;
    };

    declare class FileSystemCache {
        static hashAlgorithms: HashAlgorithm[];
        readonly basePath: string;
        readonly ns?: unknown;
        readonly extension?: string;
        readonly hash: HashAlgorithm;
        readonly ttl: number;
        basePathExists?: boolean;
        constructor(options?: FileSystemCacheOptions);
        path(key: string): string;
        fileExists(key: string): Promise<boolean>;
        ensureBasePath(): Promise<void>;
        get(key: string, defaultValue?: unknown): Promise<unknown>;
        getSync(key: string, defaultValue?: unknown): unknown;
        set(
            key: string,
            value: unknown,
            ttl?: number
        ): Promise<{
            path: string;
        }>;
        setSync(key: string, value: unknown, ttl?: number): this;
        remove(key: string): Promise<void>;
        clear(): Promise<void>;
        save(
            input: (
                | {
                      key: string;
                      value: unknown;
                  }
                | null
                | undefined
            )[]
        ): Promise<{
            paths: string[];
        }>;
        load(): Promise<{
            files: {
                path: string;
                value: unknown;
            }[];
        }>;
    }

    declare const _default: (options?: FileSystemCacheOptions) => FileSystemCache;

    export { FileSystemCache as Cache, FileSystemCache, _default as default };
}
