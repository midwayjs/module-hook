# module-hook

在指定名称及版本的模块被加载前执行指定的操作，方便对模块进行修改或源码替换。

## Installation

```bash
$ npm install module-hook --save
```

## Usage

```javascript
import { hook } from 'module-hook';

hook('debug', '^3.x', (loadModule, replaceSource, version) => {
  // loadModule: 加载模块下的文件
  // replaceSource(file, replacer): 覆盖指定文件源码
  //   replacer(source): replacer 可以是文件地址或者函数，函数参数如上所述
  // version: 当前加载的模块版本
});
```

## License

[MIT](LICENSE)