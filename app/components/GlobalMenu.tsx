import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter } from "expo-router";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePharmacienAuth } from "../context/PharmacienAuthContext";
import { useUnreadCount } from "../lib/useNotifications";
import { colors, withBottomInset } from "./ui/theme";
import {
  getMenuConfig,
  responsiveFontSize,
  responsiveSpacing,
  useScreenDimensions,
} from "../utils/responsive";

type MenuItem = {
  path: "/dashboard" | "/notifications" | "/stock" | "/commandes" | "/profil";
  label: string;
  library: "ion" | "material";
  icon: string;
  badge?: number;
};

export default function GlobalMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { pharmacien } = usePharmacienAuth();
  const { unread } = useUnreadCount(pharmacien?.id, pharmacien?.pharmacieId);

  const menuConfig = getMenuConfig();
  const { width: screenWidth } = useScreenDimensions();
  // Le menu est fixé sous la barre système (edge-to-edge) : il grandit
  // de l'inset bas pour que les boutons système ne recouvrent pas les libellés.
  const insets = useSafeAreaInsets();
  const containerStyle = [
    styles.menuContainer,
    {
      width: screenWidth,
      height: withBottomInset(menuConfig.height, insets.bottom),
      paddingBottom: insets.bottom,
    },
  ];

  const isActive = (path: string): boolean => pathname.startsWith(path);

  const navigate = (path: MenuItem["path"]): void => {
    if (!isActive(path)) {
      void Haptics.selectionAsync().catch(() => undefined);
      router.push(path);
    }
  };

  // Menu réservé aux écrans connectés (ni accueil, ni auth, ni abonnement).
  const shouldHideMenu =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/inscription") ||
    pathname.startsWith("/abonnement") ||
    pathname.startsWith("/paiement");
  if (shouldHideMenu) {
    return null;
  }

  const items: MenuItem[] = [
    { path: "/dashboard", label: "Accueil", library: "ion", icon: "home" },
    {
      path: "/notifications",
      label: "Alertes",
      library: "ion",
      icon: "notifications",
      badge: unread,
    },
    { path: "/stock", label: "Stock", library: "material", icon: "inventory" },
    {
      path: "/commandes",
      label: "Commandes",
      library: "material",
      icon: "shopping-cart",
    },
    { path: "/profil", label: "Compte", library: "material", icon: "person" },
  ];

  return (
    <View style={containerStyle}>
      {items.map((item) => {
        const active = isActive(item.path);
        const color = active ? colors.primary : colors.textMuted;
        return (
          <TouchableOpacity
            key={item.path}
            style={[styles.menuItem, active && styles.activeMenuItem]}
            onPress={() => navigate(item.path)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View>
              {item.library === "ion" ? (
                <Ionicons
                  name={item.icon as "home"}
                  size={menuConfig.itemSize}
                  color={color}
                />
              ) : (
                <MaterialIcons
                  name={item.icon as "inventory"}
                  size={menuConfig.itemSize}
                  color={color}
                />
              )}
              {typeof item.badge === "number" && item.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.badge > 99 ? "99+" : String(item.badge)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.menuText, active && styles.activeMenuText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: responsiveSpacing(10),
    paddingHorizontal: responsiveSpacing(6),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    position: "absolute",
    bottom: 0,
    left: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveSpacing(5),
    paddingHorizontal: responsiveSpacing(10),
    borderRadius: responsiveSpacing(20),
    minWidth: responsiveSpacing(56),
  },
  activeMenuItem: {
    backgroundColor: colors.primarySoft,
  },
  menuText: {
    fontSize: responsiveFontSize(11),
    marginTop: responsiveSpacing(4),
    color: colors.textMuted,
  },
  activeMenuText: {
    color: colors.primary,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "700",
  },
});
