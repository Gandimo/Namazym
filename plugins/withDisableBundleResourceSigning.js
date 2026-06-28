const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

/**
 * Disables code signing for CocoaPods resource-bundle targets.
 *
 * Since Xcode 14 resource bundles are signed by default, which fails on the
 * EAS build servers with:
 *   "resource bundles are signed by default, which requires setting the
 *    development team for each resource bundle target."
 *
 * The recommended workaround is a Podfile `post_install` hook that turns code
 * signing off for every `com.apple.product-type.bundle` target. This plugin
 * injects that hook idempotently into the generated Podfile during prebuild,
 * so the project stays managed/CNG (no committed ios/).
 */

const START = '# NAMAZYM_DISABLE_RESOURCE_BUNDLE_SIGNING_START';
const END = '# NAMAZYM_DISABLE_RESOURCE_BUNDLE_SIGNING_END';

function buildSnippet(installerVar, indent) {
  const lines = [
    START,
    `${installerVar}.pods_project.targets.each do |target|`,
    '  if target.respond_to?(:product_type) && target.product_type == "com.apple.product-type.bundle"',
    '    target.build_configurations.each do |config|',
    "      config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'",
    "      config.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'",
    "      config.build_settings['CODE_SIGNING_IDENTITY'] = ''",
    '    end',
    '  end',
    'end',
    END,
  ];
  return lines.map((line) => (line ? indent + line : line)).join('\n');
}

function injectIntoPodfile(contents) {
  // Idempotent: never insert twice.
  if (contents.includes(START)) {
    return contents;
  }

  // Insert at the very start of the existing `post_install do |installer|`
  // block so it runs inside it and reuses the real installer variable, without
  // having to locate the matching `end`. Our code is self-contained and does
  // not depend on the rest of the post_install body.
  const postInstallRe = /^([ \t]*)post_install do \|([A-Za-z_][A-Za-z0-9_]*)\|[ \t]*\r?\n/m;
  const match = contents.match(postInstallRe);

  if (match) {
    const baseIndent = match[1] || '';
    const installerVar = match[2];
    const snippet = buildSnippet(installerVar, baseIndent + '  ') + '\n';
    const insertPos = match.index + match[0].length;
    return contents.slice(0, insertPos) + snippet + contents.slice(insertPos);
  }

  // No post_install block — append a fresh top-level one.
  const block = ['', 'post_install do |installer|', buildSnippet('installer', '  '), 'end', ''].join('\n');
  return contents.replace(/\s*$/, '\n') + block + '\n';
}

module.exports = function withDisableBundleResourceSigning(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfilePath, 'utf8');
      fs.writeFileSync(podfilePath, injectIntoPodfile(contents), 'utf8');
      return cfg;
    },
  ]);
};
