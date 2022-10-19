import slugify from "slugify";

function getSlug(text: string, options?: {
    truncate?: number,
    replacement?: string,
}) {
    const seperator = options?.replacement || '-';
    let result = slugify(text, {
        remove: /[*+~.()'"!:@,]/g,
        lower: true,
        replacement: seperator
    })

    if (options?.truncate && options.truncate < result.length) {
        const lucky = result.charAt(options?.truncate) == seperator;
        result = result.slice(0, options?.truncate);
        if (!lucky) {
            result = result.slice(0, result.lastIndexOf(seperator));
        }
    }

    return result;
}

export { getSlug }