+ [`Webpack`支持直接运行`.ts`的`config`文件,如 `webpack.config.ts`](https://stackoverflow.com/questions/40075269/is-it-possible-to-write-webpack-config-in-typescript/41137188#41137188)

+ [`iconv-lite`:node下的字符编码转换](https://github.com/ashtuchkin/iconv-lite),将`buffer`解码为正常格式字符串

+ `electron`中`app`对象上的[`getFileIcon](https://www.electronjs.org/zh/docs/latest/api/app#appgetfileiconpath-options)方法可以根据文件路径获取对应文件或者系统文件的icon文件(返回类型为Buffer文件`Electron.NativeImage`),使用`toDataURL`将其转换为`BASE64`格式即可
