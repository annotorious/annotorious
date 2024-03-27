const fs = require('fs');
const path = require('path');

const searchDirectories = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules')
        fileList = searchDirectories(filePath, fileList);
    } else {
      if (file === 'package.json') {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
};

const updateVersionNumbers = (filePath, newVersion) => {
  try {
    let packageJson = fs.readFileSync(filePath, 'utf8');
    const packageData = JSON.parse(packageJson);

    packageData.version = newVersion;

    if (packageData.dependencies) {
      for (const dep in packageData.dependencies) {
        if (dep.startsWith('@annotorious/')) {
          packageData.dependencies[dep] = newVersion;
        }
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2), 'utf8');
    console.log(`Updated ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}: ${error}`);
  }
}

const main = () => {
  const newVersion = process.argv[2];

  const packageJsonFiles = searchDirectories('.');

  packageJsonFiles.forEach(filePath => {
    updateVersionNumbers(filePath, newVersion);
  });

  console.log(`All package.json files updated to version ${newVersion}`);
};

main();
