import { goBack } from "@/utils/nav";
import { useTheme } from "@/theme";
import { ScreenContainer, KeyboardScroll, MobileChangeForm, ScreenHeader } from "@/components/ui";
import { storeApi } from "@/api";
import { useAuthStore } from "@/store";

export default function ChangeStoreMobile() {
  const { colors } = useTheme();
  const merchant = useAuthStore((s) => s.merchant);
  const setMerchant = useAuthStore((s) => s.setMerchant);

  return (
    <ScreenContainer edges={["top", "bottom"]} padded={false} bg={colors.surface}>
      <ScreenHeader title="Change login mobile" onBack={() => goBack()} />
      <KeyboardScroll contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <MobileChangeForm
          currentMobile={merchant?.mobile}
          request={async (mobile) => (await storeApi.requestMobileOtp(mobile)).data}
          verify={async (mobile, otp) => {
            const res = await storeApi.verifyMobileOtp(mobile, otp);
            setMerchant(res.data);
          }}
          onDone={() => goBack()}
        />
      </KeyboardScroll>
    </ScreenContainer>
  );
}
