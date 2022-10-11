const chalk = require('chalk');
const simpleGit = require('simple-git');
const shell = require('shelljs');
const path = require('path');

const NeedCheckExtends = ['.js', '.ts', '.jsx', '.tsx'];
// 需提供完整路径，防止重名文件影响
// eg: utils/index.ts
const IgnoreFils = [];

const args = require('minimist')(process.argv.slice(2));
const referenceBranch = args.m || 'develop';
const businessBranch = args.b || '';
const project = args.p || path.resolve(__dirname);

function getCurrentBranch(git) {
  return new Promise((resolve) => {
    git.status((err, status) => {
      if (status && status.current) {
        resolve(status.current);
      } else {
        resolve();
      }
    });
  });
}

async function check() {
  const startTime = +new Date();
  console.log(chalk.green.bold('开始检测...\n'));

  const git = simpleGit(project);
  if (!businessBranch) {
    businessBranch = await getCurrentBranch(git);
  }

  console.log(chalk.green(`【参照分支：${referenceBranch}，当前分支：${businessBranch}】\n`));
  console.log(chalk.foregroundColors('【变更文件】：'));

  const diffCmd = `git diff ${referenceBranch} ${businessBranch} --stat`;
  const diffRef = shell.exec(diffCmd);

  let needCheckFiles = [];

  if (diffRef.code == 0) {
    const diffFileArray = (diffRef.stdout || '').split('\n');
    for (let i = 0; i < diffFileArray.length; i++) {
      const tmpArray = diffFileArray[i].split('|');
      if (tmpArray.length) {
        const filePath = tmpArray[0].trim();
        const extname = path.extname(filePath);

        if (NeedCheckExtends.indexOf(extname) !== -1 && IgnoreFils.indexOf(filePath) < 0) {
          needCheckFiles.push(filePath);
        }
      }
    }

    needCheckFiles = needCheckFiles.filter((i) => !!i);
  }

  if (needCheckFiles.length) {
    console.log('\n');

    shell
      .grep('-n', 'console', needCheckFiles)
      .stdout.split('\n')
      .forEach((i) => {
        if (i.match('console')) {
          console.log(chalk.red(i));
        } else {
          console.log(chalk.bold.bgHex('#FFE402').hex('#000')(i));
        }
      });
  }

  const endTime = +new Date();
  const totalTime = parseInt((endTime - startTime) / 1000, 10);
  console.log(`检测耗时：${chalk.red(totalTime + 's')}`);
}
