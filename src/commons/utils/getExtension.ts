export function getExtension(filename: string) {
    const splits = filename?.split('.');
    if (splits.length > 1) {
        return splits[splits.length - 1];
    } else {
        return '';
    }
}

export function getFileType(mimetype: string) {
    if (mimetype.indexOf('image') != -1) return 'images';
    if (mimetype.indexOf('video') != -1) return 'videos';
    return 'files';
  }