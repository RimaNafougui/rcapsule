"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Switch,
  Avatar,
  Divider,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  PhotoIcon,
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
  CreditCardIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  EyeSlashIcon,
  AtSymbolIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { useUser } from "@/lib/contexts/UserContext";
import { ImageUpload } from "@/components/closet/ImageUpload";
import LocationInput from "@/components/settings/LocationInput";

const STYLE_TAGS = [
  { label: "Minimalist", value: "minimalist" },
  { label: "Streetwear", value: "streetwear" },
  { label: "Vintage", value: "vintage" },
  { label: "Business", value: "business" },
  { label: "Casual", value: "casual" },
  { label: "Athleisure", value: "athleisure" },
  { label: "Bohemian", value: "bohemian" },
  { label: "Y2K", value: "y2k" },
  { label: "Dark Academia", value: "dark_academia" },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { user, refreshUser, isPremium } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("profile");

  // Consolidated Form Data based on User Schema
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    image: "",
    coverImage: "",
    instagramHandle: "",
    tiktokHandle: "",
    pinterestHandle: "",
    styleTags: new Set<string>([]),
    profilePublic: false,
    showClosetValue: false,
    showItemPrices: false,
    allowMessages: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/profile");

      if (res.ok) {
        const data = await res.json();

        setFormData({
          name: data.name || "",
          username: data.username || "",
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
          image: data.image || "",
          coverImage: data.coverImage || "",
          instagramHandle: data.instagramHandle || "",
          tiktokHandle: data.tiktokHandle || "",
          pinterestHandle: data.pinterestHandle || "",
          styleTags: new Set(data.styleTags || []),
          profilePublic: data.profilePublic || false,
          showClosetValue: data.showClosetValue || false,
          showItemPrices: data.showItemPrices || false,
          allowMessages: data.allowMessages ?? true,
        });
      }
    } catch (error) {
      console.error("Failed to load settings", error);
      toast.error("Failed to load settings. Please refresh.");
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchSettings();
    }
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && user) {
      // Initialize form with user data
      setFormData({
        name: user.name || "",
        username: user.username || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        image: user.image || "",
        coverImage: user.coverImage || "",
        instagramHandle: user.instagramHandle || "",
        tiktokHandle: user.tiktokHandle || "",
        pinterestHandle: user.pinterestHandle || "",
        styleTags: new Set(user.styleTags || []),
        profilePublic: user.profilePublic || false,
        showClosetValue: user.showClosetValue || false,
        showItemPrices: user.showItemPrices || false,
        allowMessages: user.allowMessages ?? true, // Default true if null
      });
    }
  }, [status, router, user]);

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const payload = {
        ...formData,
        styleTags: Array.from(formData.styleTags),
      };

      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await refreshUser();
        setMessage({ text: "Settings saved successfully.", type: "success" });
      } else {
        const errorData = await response.json();

        setMessage({
          text: errorData.error || "Failed to save settings.",
          type: "error",
        });
      }
    } catch (_error) {
      setMessage({ text: "An error occurred.", type: "error" });
    } finally {
      setLoading(false);
      router.push("/profile");
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = await response.json();

      if (data.url) window.location.href = data.url;
      else
        setMessage({ text: "Failed to open billing portal.", type: "error" });
    } catch (_error) {
      setMessage({ text: "An error occurred.", type: "error" });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });

      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({
        text: "Password must be at least 6 characters.",
        type: "error",
      });

      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setMessage({ text: "Password changed successfully.", type: "success" });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const data = await response.json();

        setMessage({
          text: data.error || "Failed to change password.",
          type: "error",
        });
      }
    } catch (_error) {
      setMessage({ text: "An error occurred.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Format subscription end date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (status === "loading") return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-12">
        <Button
          isIconOnly
          radius="full"
          variant="light"
          onPress={() => router.back()}
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-2">
            Settings
          </h1>
          <p className="text-xs uppercase tracking-widest text-default-500">
            Manage account, profile & visibility
          </p>
        </div>
      </div>

      {/* MESSAGE BANNER */}
      {message.text && (
        <div
          className={`mb-8 p-4 border-l-4 text-sm ${message.type === "success" ? "border-success bg-success-50 text-success-700" : "border-danger bg-danger-50 text-danger-700"}`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* SIDEBAR TABS */}
        <div className="lg:col-span-3">
          <div className="flex flex-col gap-2 sticky top-24">
            {[
              { id: "profile", label: "Public Profile", icon: UserCircleIcon },
              { id: "socials", label: "Social Links", icon: AtSymbolIcon },
              {
                id: "preferences",
                label: "App Preferences",
                icon: AdjustmentsHorizontalIcon,
              },
              {
                id: "subscription",
                label: "Subscription",
                icon: CreditCardIcon,
              },
              { id: "security", label: "Security", icon: ShieldCheckIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-3 text-left px-4 py-3 text-xs uppercase tracking-widest font-bold transition-all border-l-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-default-400 hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="lg:col-span-9 space-y-12">
          {/* PROFILE SECTION */}
          {activeTab === "profile" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <UserCircleIcon className="w-6 h-6" /> Profile Details
                </h2>
                <Divider className="my-4" />
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-default-500">
                    Avatar
                  </span>
                  <div className="flex items-center gap-4">
                    <Avatar
                      isBordered
                      className="w-24 h-24 text-large"
                      name={formData.name}
                      src={formData.image || undefined}
                    />
                    <div className="flex-1">
                      <ImageUpload
                        folder="profile"
                        label="Change Avatar"
                        value={formData.image}
                        onChange={(url) => updateField("image", url)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-default-500">
                    Cover Image
                  </span>
                  <div className="flex items-center gap-4">
                    {formData.coverImage ? (
                      <div
                        className="w-24 h-24 rounded-medium bg-cover bg-center border border-default-200"
                        style={{
                          backgroundImage: `url(${formData.coverImage})`,
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-medium bg-default-100 flex items-center justify-center border border-default-200">
                        <PhotoIcon className="w-8 h-8 text-default-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <ImageUpload
                        folder="profile_covers"
                        label="Change Cover"
                        value={formData.coverImage}
                        onChange={(url) => updateField("coverImage", url)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Display Name"
                  radius="none"
                  value={formData.name}
                  variant="bordered"
                  onChange={(e) => updateField("name", e.target.value)}
                />
                <Input
                  isReadOnly
                  isDisabled={true}
                  label="Username"
                  radius="none"
                  startContent={<span className="text-default-400">@</span>}
                  value={formData.username}
                  variant="bordered"
                />

                <LocationInput
                  value={formData.location}
                  onChange={(value) => updateField("location", value)}
                />
                <Textarea
                  className="md:col-span-2"
                  label="Bio"
                  placeholder="Tell us a bit about your style..."
                  radius="none"
                  value={formData.bio}
                  variant="bordered"
                  onChange={(e) => updateField("bio", e.target.value)}
                />
                <Input
                  className="md:col-span-2"
                  label="Website"
                  radius="none"
                  startContent={
                    <span className="text-default-400 text-xs">https://</span>
                  }
                  value={formData.website}
                  variant="bordered"
                  onChange={(e) => updateField("website", e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  className="uppercase font-bold tracking-widest px-8"
                  color="primary"
                  isLoading={loading}
                  radius="none"
                  onPress={handleSaveSettings}
                >
                  Save Profile
                </Button>
              </div>
            </div>
          )}

          {/* SOCIALS SECTION */}
          {activeTab === "socials" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <AtSymbolIcon className="w-6 h-6" /> Social Connections
                </h2>
                <Divider className="my-4" />
                <p className="text-sm text-default-500 mb-6">
                  Link your social media profiles to display them on your public
                  closet.
                </p>
              </div>

              <div className="max-w-xl space-y-6">
                <Input
                  label="Instagram"
                  radius="none"
                  startContent={
                    <span className="text-default-400 w-20 text-xs">
                      instagram.com/
                    </span>
                  }
                  value={formData.instagramHandle}
                  variant="bordered"
                  onChange={(e) =>
                    updateField("instagramHandle", e.target.value)
                  }
                />
                <Input
                  label="TikTok"
                  radius="none"
                  startContent={
                    <span className="text-default-400 w-20 text-xs">
                      tiktok.com/@
                    </span>
                  }
                  value={formData.tiktokHandle}
                  variant="bordered"
                  onChange={(e) => updateField("tiktokHandle", e.target.value)}
                />
                <Input
                  label="Pinterest"
                  radius="none"
                  startContent={
                    <span className="text-default-400 w-20 text-xs">
                      pinterest.com/
                    </span>
                  }
                  value={formData.pinterestHandle}
                  variant="bordered"
                  onChange={(e) =>
                    updateField("pinterestHandle", e.target.value)
                  }
                />

                <div className="flex justify-end pt-4">
                  <Button
                    className="uppercase font-bold tracking-widest px-8"
                    color="primary"
                    isLoading={loading}
                    radius="none"
                    onPress={handleSaveSettings}
                  >
                    Save Links
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES SECTION */}
          {activeTab === "preferences" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-6 h-6" /> App
                  Preferences
                </h2>
                <Divider className="my-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Privacy Settings */}
                <div className="space-y-6">
                  <h3 className="font-semibold text-default-500 uppercase text-xs tracking-wider mb-4">
                    Privacy & Visibility
                  </h3>

                  <div className="flex justify-between items-center py-2">
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Public Profile</p>
                      <p className="text-xs text-default-500">
                        Allow others to find your profile
                      </p>
                    </div>
                    <Switch
                      isSelected={formData.profilePublic}
                      onValueChange={(val) => updateField("profilePublic", val)}
                    />
                  </div>
                  <Divider />

                  <div className="flex justify-between items-center py-2">
                    <div className="space-y-1 flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-default-400" />
                      <p className="font-bold text-sm">Allow Messages</p>
                    </div>
                    <Switch
                      isSelected={formData.allowMessages}
                      onValueChange={(val) => updateField("allowMessages", val)}
                    />
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <div className="space-y-1 flex items-center gap-2">
                      <CurrencyDollarIcon className="w-4 h-4 text-default-400" />
                      <p className="font-bold text-sm">Show Item Prices</p>
                    </div>
                    <Switch
                      isSelected={formData.showItemPrices}
                      onValueChange={(val) =>
                        updateField("showItemPrices", val)
                      }
                    />
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <div className="space-y-1 flex items-center gap-2">
                      <EyeSlashIcon className="w-4 h-4 text-default-400" />
                      <p className="font-bold text-sm">
                        Show Total Closet Value
                      </p>
                    </div>
                    <Switch
                      isSelected={formData.showClosetValue}
                      onValueChange={(val) =>
                        updateField("showClosetValue", val)
                      }
                    />
                  </div>
                </div>

                {/* Style Settings */}
                <div className="space-y-6">
                  <h3 className="font-semibold text-default-500 uppercase text-xs tracking-wider mb-4">
                    Style Profile
                  </h3>
                  <Select
                    classNames={{ trigger: "min-h-12" }}
                    label="Style Tags"
                    placeholder="Identify your aesthetics"
                    radius="none"
                    selectedKeys={formData.styleTags}
                    selectionMode="multiple"
                    variant="bordered"
                    onSelectionChange={(keys) =>
                      updateField(
                        "styleTags",
                        new Set(keys as unknown as string[]),
                      )
                    }
                  >
                    {STYLE_TAGS.map((style) => (
                      <SelectItem key={style.value} textValue={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <p className="text-xs text-default-400">
                    These tags help us personalize your recommendations and help
                    others find your style.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <Button
                  className="uppercase font-bold tracking-widest px-8 shadow-lg shadow-primary/20"
                  color="primary"
                  isLoading={loading}
                  radius="none"
                  onPress={handleSaveSettings}
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION SECTION */}
          {activeTab === "subscription" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <CreditCardIcon className="w-6 h-6" /> Subscription
                </h2>
                <Divider className="my-4" />
              </div>

              {isPremium ? (
                <div className="space-y-6">
                  <div className="border border-foreground bg-foreground text-background p-8">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-widest opacity-60">
                            Current Plan
                          </span>
                        </div>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                          Premium
                        </h3>
                      </div>
                    </div>
                    {user?.subscription_period_end && (
                      <p className="mt-4 text-sm opacity-60">
                        Renews on{" "}
                        <span className="font-bold">
                          {formatDate(user.subscription_period_end)}
                        </span>
                      </p>
                    )}
                  </div>
                  <Button
                    className="uppercase font-bold tracking-widest"
                    isLoading={portalLoading}
                    radius="none"
                    variant="bordered"
                    onPress={handleManageSubscription}
                  >
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border border-dashed border-default-300 p-8 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mx-auto">
                      <SparklesIcon className="w-8 h-8 text-default-400" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold">
                        Unlock Premium Features
                      </h4>
                      <p className="text-default-500 text-sm max-w-md mx-auto">
                        Get AI-powered outfit recommendations, magic background
                        removal, and more.
                      </p>
                    </div>
                    <Button
                      className="uppercase font-bold tracking-widest px-12"
                      color="primary"
                      radius="none"
                      size="lg"
                      onPress={() => router.push("/pricing")}
                    >
                      Upgrade
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECURITY SECTION */}
          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheckIcon className="w-6 h-6" /> Password & Auth
                </h2>
                <Divider className="my-4" />
              </div>

              <div className="max-w-md space-y-6">
                <Input
                  isReadOnly
                  className="opacity-60"
                  endContent={
                    <CheckCircleIcon className="w-5 h-5 text-success" />
                  }
                  label="Email"
                  radius="none"
                  value={session?.user?.email || ""}
                  variant="bordered"
                />
                <Divider />
                <Input
                  label="Current Password"
                  radius="none"
                  type="password"
                  value={passwordData.currentPassword}
                  variant="bordered"
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
                <Input
                  label="New Password"
                  radius="none"
                  type="password"
                  value={passwordData.newPassword}
                  variant="bordered"
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
                <Input
                  label="Confirm New Password"
                  radius="none"
                  type="password"
                  value={passwordData.confirmPassword}
                  variant="bordered"
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />

                <div className="pt-4">
                  <Button
                    className="uppercase font-bold tracking-widest"
                    color="primary"
                    isLoading={loading}
                    radius="none"
                    onPress={handleChangePassword}
                  >
                    Update Password
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
