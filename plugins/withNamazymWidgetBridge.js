const fs = require('fs');
const path = require('path');
const {
  IOSConfig,
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} = require('@expo/config-plugins');

const APP_GROUP_ID = 'group.com.namazym.app';
const BRIDGE_GROUP_NAME = 'NamazymWidgetBridge';
const BRIDGE_FILES = ['NamazymWidgetBridge.swift', 'NamazymWidgetBridge.m'];

const ensureAppGroupEntitlement = (entitlements) => {
  const key = 'com.apple.security.application-groups';
  const existingGroups = Array.isArray(entitlements[key]) ? entitlements[key] : [];

  if (!existingGroups.includes(APP_GROUP_ID)) {
    entitlements[key] = [...existingGroups, APP_GROUP_ID];
  }

  return entitlements;
};

const copyBridgeTemplates = (projectRoot, platformRoot) => {
  const sourceDir = path.join(projectRoot, 'plugins', 'namazym-widget-bridge');
  const targetDir = path.join(platformRoot, BRIDGE_GROUP_NAME);

  fs.mkdirSync(targetDir, { recursive: true });

  for (const fileName of BRIDGE_FILES) {
    fs.copyFileSync(path.join(sourceDir, fileName), path.join(targetDir, fileName));
  }
};

const getMainTarget = (xcodeProject) => {
  const targets = xcodeProject.getFirstProject().firstProject.targets;
  const appTarget = targets.find((target) => {
    const nativeTarget = xcodeProject.pbxNativeTargetSection()[target.value];
    return nativeTarget?.productType === '"com.apple.product-type.application"';
  });

  return appTarget ?? xcodeProject.getFirstTarget();
};

const hasFileReference = (xcodeProject, filePath) => {
  const fileReferences = xcodeProject.hash.project.objects.PBXFileReference ?? {};

  return Object.values(fileReferences).some((fileReference) => {
    return fileReference?.path === filePath || fileReference?.path === `"${filePath}"`;
  });
};

const addBridgeFilesToProject = (config, xcodeProject) => {
  const target = getMainTarget(xcodeProject);
  const targetUuid = target.uuid ?? target.value;
  const productName = IOSConfig.XcodeUtils.getProductName(xcodeProject);

  let bridgeGroup = xcodeProject.pbxGroupByName(BRIDGE_GROUP_NAME);
  if (!bridgeGroup) {
    bridgeGroup = xcodeProject.addPbxGroup([], BRIDGE_GROUP_NAME, BRIDGE_GROUP_NAME);
    const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
    xcodeProject.addToPbxGroup(bridgeGroup.uuid, mainGroup);
  }

  for (const fileName of BRIDGE_FILES) {
    const filePath = `${BRIDGE_GROUP_NAME}/${fileName}`;

    if (hasFileReference(xcodeProject, filePath)) {
      continue;
    }

    xcodeProject.addSourceFile(filePath, { target: targetUuid }, bridgeGroup.uuid);
  }

  const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();
  for (const buildConfiguration of Object.values(buildConfigurations)) {
    if (
      buildConfiguration?.buildSettings?.PRODUCT_NAME === `"${productName}"`
      || buildConfiguration?.buildSettings?.PRODUCT_NAME === productName
    ) {
      buildConfiguration.buildSettings.SWIFT_OBJC_BRIDGING_HEADER =
        `${productName}/${productName}-Bridging-Header.h`;
      buildConfiguration.buildSettings.SWIFT_VERSION =
        buildConfiguration.buildSettings.SWIFT_VERSION ?? '5.0';
    }
  }
};

const withNamazymWidgetBridge = (config) => {
  config = withEntitlementsPlist(config, (pluginConfig) => {
    pluginConfig.modResults = ensureAppGroupEntitlement(pluginConfig.modResults);
    return pluginConfig;
  });

  config = withDangerousMod(config, [
    'ios',
    (pluginConfig) => {
      copyBridgeTemplates(pluginConfig.modRequest.projectRoot, pluginConfig.modRequest.platformProjectRoot);
      return pluginConfig;
    },
  ]);

  config = withXcodeProject(config, (pluginConfig) => {
    addBridgeFilesToProject(pluginConfig, pluginConfig.modResults);
    return pluginConfig;
  });

  return config;
};

module.exports = withNamazymWidgetBridge;
