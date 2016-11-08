import inquirer from 'inquirer';
import semver from 'semver';
import { validate as urlValidate } from 'url-regexp';

const getArrayFromList = list =>
  list.split(',')
    .map(item => item.replace(', ', ','))
    .map(item => item.replace(/(^\s|\s$)/g, ''))
    .filter(item => item !== '')
;

const validateArray = (arr, rgx, msg) =>
  arr.reduce((prev, item) => rgx.test(item) && prev, true ) || msg;

export default async ({ packageJson }) => {
  console.log('\n');
  const npmValues = await inquirer.prompt([{
    type: 'input',
    name: 'name',
    message: 'Name (like my-package-name):',
    validate(name) { return /^[a-z0-9-]+$/.test(name) || 'Incorrect format. It should be something like my-package-name.'; },
  }, {
    type: 'input',
    name: 'version',
    message: 'Version:',
    default() { return '1.0.0'; },
    validate(version) { return !!semver.valid(version) || 'Incorrect version format.'; },
  }, {
    type: 'input',
    name: 'description',
    message: 'Description:',
    validate(name) { return (name !== '') || 'Please add a description.'; },
  }, {
    type: 'input',
    name: 'repository',
    message: 'Git repository (like https://github.com/user/repo):',
    filter(repo) { return repo.replace(/\.git$/, ''); },
    validate(url) { return (url === '' || urlValidate(url)) || 'Incorrect format. Enter a url or nothing at all.'; }
  }, {
    type: 'input',
    name: 'keywords',
    message: 'Keywords (comma separated list):',
    filter(keywords) { return getArrayFromList(keywords).concat(['worona', 'package']); },
    validate(keywords) { return validateArray(keywords, /^[a-z0-9\s]*$/) ||
      'Incorrect format. Keywords should be made only of letters and numbers'; },
  }, {
    type: 'input',
    name: 'authors',
    message: 'Author emails (comma seperated list):',
    filter: getArrayFromList,
    validate(emails) {
      return (emails.length > 0 && validateArray(emails,/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/))
        || 'Emails not valid');
    },
  }, {
    type: 'input',
    name: 'license',
    message: 'License:',
    default() { return 'MIT'; },
  }]);
  const worona = await inquirer.prompt([{
    type: 'input',
    name: 'niceName',
    message: 'Nice name (like My Package Name):',
    validate(name) { return /^[\w\s]+$/.test(name) || 'Incorrect format. Use only letters or spaces.'; },
  }, {
    type: 'input',
    name: 'slug',
    message: 'Slug (like MyPackageName):',
    validate(name) { return /^[a-zA-Z0-9]+$/.test(name) || 'Incorrect format. Slug should be in camelcase.'; },
  }, {
    type: 'list',
    name: 'type',
    choices: ['extension', 'theme'],
    message: 'Type:',
  }, {
    type: 'checkbox',
    name: 'services',
    choices: ['dashboard', 'app'],
    message: 'Service:',
    default() { return ['dashboard']; },
    validate(services) { return services.length > 0 || 'Select at least one service.'; },
  }]);
  worona.namespace = 'theme';
  if (worona.type !== 'theme') {
    const { namespace } = await inquirer.prompt([{
      type: 'input',
      name: 'namespace',
      message: 'Namespace:',
      validate(name) { return /^[a-zA-Z0-9]+$/.test(name) || 'Incorrect format. Namespace should be in camelcase.'; },
    }]);
    worona.namespace = namespace;
  }
  if (worona.services.indexOf('dashboard') !== -1) {
    const { category, order } = await inquirer.prompt([{
      type: 'list',
      name: 'category',
      choices: ['Settings', 'Themes', 'Extensions', 'Publish'],
      message: 'Dashboard menu category:',
    }, {
      type: 'input',
      name: 'order',
      message: 'Dashboard menu order:',
      default: 10,
      filter(number) { return parseInt(number); },
      validate(order) {
        const number = parseInt(order);
        return (!isNaN(number) && number >= 0 && number <= 100) || 'Please enter a number between 0 and 100.' },
    }]);
    worona.menu = { category, order };
  }
  worona.default = false;
  worona.core = false;
  worona.listed = true;
  worona.deactivable = true;
  worona.public = true;
  worona.authors = [npmValues.author];

  if (npmValues.repository !== '') {
    npmValues.bugs = { url: `${npmValues.repository}/issues` };
    npmValues.homepage = `${npmValues.repository}#readme`;
    const repo = /\.git$/.test(npmValues.repository) ? npmValues.repository : `${npmValues.repository}.git`;
    npmValues.repository = { type: 'git', url: `git+${repo}` };
  }

  console.log('\n');
  return { ...packageJson, ...npmValues, worona };
};