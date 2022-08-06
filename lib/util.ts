import * as path from 'path';

import * as fse from 'fs-extra';
import * as mustache from 'mustache';

const filePath = path.join(process.cwd(), 'config.json');
const contents = fse.readFileSync(filePath, 'utf8');
const config = JSON.parse(contents);
const { templateValues } = config;

/**
 * templateDirectory is the top level directory where all the templates are stored
 * currentChildDirectory is the current path underneath the templateDirectory that we are processing
 * siteDirectory is where processed HTML templates should be written
 */
export function processTemplates(templateDirectory: string, currentChildDirectory: string, siteDirectory: string) {
  const currentDirectory = `${templateDirectory}${currentChildDirectory}`;
  const directoryEntries = fse.readdirSync(currentDirectory, { withFileTypes: true });
  const files = directoryEntries
    .filter((dirent: any) => dirent.isFile())
    .map((dirent: any) => dirent.name);
  const directories = directoryEntries
    .filter((dirent: any) => dirent.isDirectory())
    .map((dirent: any) => dirent.name);
  files.forEach((file) => {
    const templatePath = `${currentDirectory}/${file}`;
    const htmlChildDirectory = `${siteDirectory}${currentChildDirectory}`;
    const htmlPath = `${htmlChildDirectory}/${file}`;
    const template = fse.readFileSync(templatePath, 'utf8');
    const staticPage = mustache.render(template, templateValues);
    fse.mkdirSync(htmlChildDirectory, { recursive: true });
    fse.writeFileSync(htmlPath, staticPage);
  });
  directories.forEach((directory) => {
    // Recursion stops when the file tree ends
    processTemplates(templateDirectory, `${currentChildDirectory}/${directory}`, siteDirectory);
  });
}
