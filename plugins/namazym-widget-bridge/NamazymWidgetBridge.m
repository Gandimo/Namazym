#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NamazymWidgetBridge, NSObject)

RCT_EXTERN_METHOD(writeSnapshot:(NSString *)json
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearSnapshot:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
