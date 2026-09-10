import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Meta re-encodes everything anyway; a high-quality H.264 master keeps text
// edges clean through their transcode.
Config.setCodec('h264');
Config.setCrf(18);
