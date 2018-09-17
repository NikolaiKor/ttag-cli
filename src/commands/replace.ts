import "../declarations";
import * as ora from "ora";
import * as c3poTypes from "../types";
import * as babelPresetReact from "@babel/preset-react";
import babelPluginC3po from "babel-plugin-ttag";
import * as babel from "@babel/core";
import * as path from "path";
import * as fs from "fs";
import { TransformFn, pathsWalk } from "../lib/pathsWalk";
import * as mkdirp from "mkdirp";

async function replace(
    pofile: string,
    out: string,
    srcPath: string,
    overrideOpts?: c3poTypes.TtagOpts
) {
    const progress: c3poTypes.Progress = ora(
        `[ttag] replacing source files with translations ...`
    );
    progress.start();
    let c3pOptions: c3poTypes.TtagOpts = {
        resolve: { translations: pofile }
    };

    if (overrideOpts) {
        c3pOptions = Object.assign(c3pOptions, overrideOpts);
    }
    const babelOptions = {
        presets: [babelPresetReact],
        plugins: [[babelPluginC3po, c3pOptions]]
    };

    const transformFn: TransformFn = file => {
        const relativePath = path.relative(srcPath, file);
        const resultPath = path.join(out, relativePath);
        const result = babel.transformFileSync(file, babelOptions);
        const dir = path.dirname(resultPath);
        if (dir !== ".") {
            mkdirp.sync(dir);
        }
        if (!result) {
            progress.fail("Failed to replace");
            return;
        }
        fs.writeFileSync(resultPath, result.code);
    };

    await pathsWalk([srcPath], progress, transformFn);
    progress.succeed(`[ttag] replace is done`);
}

export default replace;
