import Constants, { ExecutionEnvironment } from "expo-constants";

export const isExpoGo = (): boolean =>
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isStandalone = (): boolean =>
    Constants.executionEnvironment === ExecutionEnvironment.Standalone;

export const isDevClient = (): boolean =>
    __DEV__ && !isExpoGo();

export const getRuntimeLabel = ():
    | "expo-go"
    | "dev-client"
    | "standalone"
    | "unknown" => {
    if (isExpoGo()) return "expo-go";
    if (isDevClient()) return "dev-client";
    if (isStandalone()) return "standalone";
    return "unknown";
};

export const getEnvironmentName = (): string => {
    const label = getRuntimeLabel();
    if (label === "expo-go") return "Expo Go";
    if (label === "dev-client") return "Dev Client";
    if (label === "standalone") return "Standalone";
    return "Unknown";
};
