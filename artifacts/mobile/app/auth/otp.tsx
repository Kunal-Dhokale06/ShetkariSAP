import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const OTP_LEN = 6;
const RESEND_SECS = 60;

const API_BASE = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api`
  : "http://localhost:8080/api";

export default function OtpScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { setVerifiedPhone } = useApp();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(RESEND_SECS);
  const [resendLoading, setResendLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LEN).fill(null));
  const isWeb = Platform.OS === "web";

  // Load pending phone; if missing after mount, redirect back to phone entry
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.multiGet(["@kisan/pending_phone", "@kisan/dev_otp"]).then(
      ([[, phoneVal], [, devOtpVal]]) => {
        if (cancelled) return;
        if (phoneVal) {
          setPhone(phoneVal);
        } else {
          // No pending phone — user navigated here directly; send them back
          setTimeout(() => {
            if (!cancelled) router.replace("/auth/phone");
          }, 800);
        }
        if (devOtpVal) setDevOtp(devOtpVal);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Countdown
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError("");
    if (digit && index < OTP_LEN - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = useCallback(
    async (code: string = digits.join("")) => {
      if (code.length < OTP_LEN) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: phone, otp: code }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || !data.success) {
          throw new Error(data.error ?? t("auth.invalidOtp"));
        }
        await setVerifiedPhone(phone);
        await AsyncStorage.multiRemove([
          "@kisan/pending_phone",
          "@kisan/dev_otp",
        ]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/auth/setup");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : t("auth.invalidOtp");
        setError(msg);
        setDigits(Array(OTP_LEN).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [digits, phone],
  );

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: phone }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t("auth.networkError"));
      setTimer(RESEND_SECS);
      setDigits(Array(OTP_LEN).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("auth.networkError"));
    } finally {
      setResendLoading(false);
    }
  };

  const otp = digits.join("");
  const maskedPhone = phone.replace(/(\d{3})(\d{4})(\d{3})/, "$1 $2 $3");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.primary, paddingTop: isWeb ? 64 : 56 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.replace("/auth/phone")}
          style={styles.backBtn}
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View
          style={[styles.lockBadge, { backgroundColor: colors.primaryDark }]}
        >
          <Text style={styles.lockEmoji}>🔐</Text>
        </View>
        <Text
          style={[
            styles.headerTitle,
            { color: "#fff", fontFamily: "Inter_700Bold" },
          ]}
        >
          {t("auth.otpTitle")}
        </Text>
        <Text
          style={[
            styles.headerSub,
            { color: colors.primaryLight, fontFamily: "Inter_400Regular" },
          ]}
        >
          {t("auth.otpSentTo")}
        </Text>
        <Text
          style={[
            styles.phoneTxt,
            { color: "#fff", fontFamily: "Inter_600SemiBold" },
          ]}
        >
          🇮🇳 +91 {maskedPhone}
        </Text>
      </View>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <View style={styles.body}>
        {/* OTP Boxes */}
        <View style={styles.boxRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputRefs.current[i] = ref;
              }}
              style={[
                styles.otpBox,
                {
                  borderColor: d
                    ? colors.primary
                    : error
                      ? colors.error
                      : colors.border,
                  backgroundColor: d ? colors.accent : colors.card,
                  color: colors.foreground,
                  fontFamily: "Inter_700Bold",
                },
              ]}
              value={d}
              onChangeText={(val) => handleDigit(i, val)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(i, nativeEvent.key)
              }
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              editable={!loading}
              autoFocus={i === 0}
            />
          ))}
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: error ? colors.error : colors.primary,
                width: `${(otp.length / OTP_LEN) * 100}%`,
              },
            ]}
          />
        </View>

        {!!error && (
          <View style={styles.errorRow}>
            <MaterialIcons
              name="error-outline"
              size={16}
              color={colors.error}
            />
            <Text
              style={[
                styles.errorText,
                { color: colors.error, fontFamily: "Inter_400Regular" },
              ]}
            >
              {error}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => handleVerify()}
          disabled={loading || otp.length < OTP_LEN}
          activeOpacity={0.85}
          style={[
            styles.verifyBtn,
            {
              backgroundColor:
                otp.length < OTP_LEN ? colors.disabled : colors.primary,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="verified" size={20} color="#fff" />
              <Text
                style={[
                  styles.verifyBtnTxt,
                  { fontFamily: "Inter_700Bold", color: "#fff" },
                ]}
              >
                {t("auth.verify")}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Resend row */}
        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text
              style={[
                styles.timerTxt,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_400Regular",
                },
              ]}
            >
              {t("auth.resendIn")} {timer}s
            </Text>
          ) : resendLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text
                style={[
                  styles.resendLink,
                  { color: colors.primary, fontFamily: "Inter_600SemiBold" },
                ]}
              >
                ↺ {t("auth.resendOtp")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/auth/phone")}
          style={styles.changeRow}
        >
          <MaterialIcons name="edit" size={14} color={colors.mutedForeground} />
          <Text
            style={[
              styles.changeTxt,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            {t("auth.changeNumber")}
          </Text>
        </TouchableOpacity>

        {/* Dev OTP hint — only shown in development builds */}
        {!!devOtp && (
          <View
            style={[
              styles.devBanner,
              { backgroundColor: "#FEF9C3", borderColor: "#CA8A04" },
            ]}
          >
            <Text style={styles.devEmoji}>🔑</Text>
            <Text
              style={[
                styles.devTxt,
                { color: "#92400E", fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {t("auth.devOtp")}: {devOtp}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "web" ? 64 : 56,
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  lockBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  lockEmoji: { fontSize: 34 },
  headerTitle: { fontSize: 22, marginBottom: 6 },
  headerSub: { fontSize: 13 },
  phoneTxt: { fontSize: 16, marginTop: 4 },
  body: { flex: 1, padding: 28 },
  boxRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 12,
  },
  otpBox: {
    width: 48,
    height: 58,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 26,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    justifyContent: "center",
  },
  errorText: { fontSize: 13 },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 16,
    marginBottom: 20,
  },
  verifyBtnTxt: { fontSize: 16 },
  resendRow: { alignItems: "center", marginBottom: 16 },
  timerTxt: { fontSize: 13 },
  resendLink: { fontSize: 14 },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
  },
  changeTxt: { fontSize: 13 },
  devBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  devEmoji: { fontSize: 18 },
  devTxt: { fontSize: 14 },
});
