/**
 * Standalone seed script for a FRESH database.
 *
 *   npm run seed            # safe: aborts if cars already exist
 *   npm run seed -- --force # destructive: wipes the collection, then reseeds
 *
 * Connects to MONGODB_URI (from .env.local). Seeding clears the entire cars
 * collection before inserting the starter grid, so by default the script
 * refuses to run when any cars already exist — pass --force (or set
 * SEED_FORCE=1) to override and wipe. On an empty collection it just seeds.
 *
 * The CARS array is a snapshot of the live database (media points at hosted
 * Cloudinary assets / YouTube IDs), so reseeding restores the full grid
 * including images, notes and spec sheets.
 *
 * Note: position/rank is never seeded — it is computed at read time by sorting
 * on zeroToHundred. We only provide the raw 0–100 times.
 */
import { config } from "dotenv";
import mongoose from "mongoose";

// Load .env.local first (fall back to .env) before reading MONGODB_URI.
config({ path: ".env.local" });
config();

import Car, { type ICar } from "../lib/models/Car";

type SeedCar = Omit<
  ICar,
  | "createdAt"
  | "updatedAt"
  | "media"
  | "specs"
  | "features"
  | "variant"
  | "notes"
> & {
  media?: ICar["media"];
  specs?: ICar["specs"];
  features?: ICar["features"];
  variant?: ICar["variant"];
  notes?: ICar["notes"];
};

// Snapshot of the live grid, sorted by zeroToHundred (fastest first).
const CARS: SeedCar[] = [
  {
    modelYear: 2026,
    manufacturer: "Chery",
    carModel: "Tiggo 8",
    engineSize: 1.5,
    fuelType: "Petrol",
    powertrainType: "Plug-In Hybrid",
    transmission: "Auto",
    induction: "Turbocharged",
    zeroToHundred: 6.24,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782995125/0to100-tracker/1000065063_zp7tte.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782995125/0to100-tracker/1000065038_oj51ga.jpg" },
      { type: "youtube", path: "SfVYdvpoPa4" },
    ],
    notes: "Off-road mode, HEV mode, Traction Control Off, Autohold Off",
  },
  {
    modelYear: 2017,
    manufacturer: "Toyota",
    carModel: "Camry",
    engineSize: 2.5,
    fuelType: "Petrol",
    powertrainType: "Hybrid",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 6.87,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996067/0to100-tracker/received_969946101396084_erlcqf_ysxkul.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996068/0to100-tracker/20240104_165914_jfbmz8_zfxteb.jpg" },
      { type: "youtube", path: "jAl53FpjhUc" },
    ],
  },
  {
    modelYear: 2011,
    manufacturer: "Hyundai",
    carModel: "Sonata",
    engineSize: 2.4,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 6.91,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996141/0to100-tracker/IMG-20230827-WA0004_iyat6i_repn4c_ktlfgh.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996141/0to100-tracker/IMG-20241125-WA0003_vj19gq_jyk1f9_nl4d3y.jpg" },
      { type: "youtube", path: "xjc67xeCY-Y" },
    ],
  },
  {
    modelYear: 2025,
    manufacturer: "Hyundai",
    carModel: "Santa Fe",
    engineSize: 1.6,
    fuelType: "Petrol",
    powertrainType: "Hybrid",
    transmission: "Auto",
    induction: "Turbocharged",
    zeroToHundred: 8.17,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996234/0to100-tracker/PXL_20251024_113636696_wjnbjm_gs893n.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996234/0to100-tracker/PXL_20251113_025018692_gnqmav_jpi72y.jpg" },
      { type: "youtube", path: "2I-oEjsj_Aw" },
    ],
  },
  {
    modelYear: 2024,
    manufacturer: "Haval",
    carModel: "H6",
    engineSize: 1.5,
    fuelType: "Petrol",
    powertrainType: "Hybrid",
    transmission: "Auto",
    induction: "Turbocharged",
    zeroToHundred: 8.21,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996360/0to100-tracker/PXL_20240607_094935179.PORTRAIT.ORIGINAL_epx5wy_xhnzoc.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996358/0to100-tracker/PXL_20241229_170235005.MP_ze0tzs_pzwvbc.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996359/0to100-tracker/PXL_20241229_170116693_1_ag21tf_xvfzne.jpg" },
      { type: "youtube", path: "OuS9tnqszAg" },
    ],
  },
  {
    modelYear: 2026,
    manufacturer: "Kia",
    carModel: "Sportage L",
    engineSize: 1.6,
    fuelType: "Petrol",
    powertrainType: "Hybrid",
    transmission: "Auto",
    induction: "Turbocharged",
    zeroToHundred: 8.24,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996442/0to100-tracker/729259482_1769319480725300_1929124202866190343_n_ubvvym_afgshv.jpg" },
      { type: "youtube", path: "XZ4XSUN0csE" },
    ],
  },
  {
    modelYear: 2014,
    manufacturer: "Toyota",
    carModel: "Camry",
    variant: "Altise",
    engineSize: 2.5,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 8.67,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783094950/0to100-tracker/PXL_20260703_151657739.NIGHT_otr9eo.jpg" },
      { type: "youtube", path: "0CBg2_lKUaE" },
    ],
    specs: [
      { label: "Power", value: "178 hp" },
      { label: "Torque", value: "230 Nm" },
      { label: "Top speed", value: "200 km/h" },
      { label: "Drivetrain", value: "FWD" },
      { label: "Cylinders", value: "Inline 4" },
      { label: "Fuel economy (combined)", value: "7.8 L/100km" },
      { label: "Kerb weight", value: "1485 kg" },
      { label: "Length", value: "4805 mm" },
      { label: "Width", value: "1820 mm" },
      { label: "Height", value: "1470 mm" },
      { label: "Wheelbase", value: "2775 mm" },
      { label: "Boot space", value: "436 litres" },
      { label: "Seating capacity", value: "5" },
      { label: "Doors", value: "4" },
      { label: "Body type", value: "Sedan" },
      { label: "Engine options", value: "2.5L I4," },
    ],
    features: [
      "Air conditioning",
      "Power windows and locks",
      "Cruise control",
      "Bluetooth connectivity",
      "Touchscreen infotainment system",
      "Stability control",
      "Anti-lock Braking System (ABS)",
      "Multiple airbags",
    ],
    notes:
      "This test was conducted on an uphill stretch. The incline increased the load on the vehicle, resulting in a slower recorded time.",
  },
  {
    modelYear: 2007,
    manufacturer: "BMW",
    carModel: "E65 730D",
    engineSize: 3.0,
    fuelType: "Diesel",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "Turbocharged",
    zeroToHundred: 8.71,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996506/0to100-tracker/IMG_20230419_223104_reamo5_unk0yb.jpg" },
      { type: "youtube", path: "_H2L1Sm89mg" },
    ],
  },
  {
    modelYear: 2022,
    manufacturer: "Chery",
    carModel: "Tiggo 8 Pro",
    engineSize: 1.6,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "Turbocharged",
    zeroToHundred: 9.09,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996621/0to100-tracker/PXL_20250719_052517474_rrlr1v_uy5isv.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996621/0to100-tracker/PXL_20240113_155030460_ux7h0x_as5djo.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996622/0to100-tracker/PXL_20240113_155017433_rgfbsx_rb9mzc.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996622/0to100-tracker/PXL_20250719_055544809_czva0l_g0k4n2.jpg" },
      { type: "youtube", path: "HDEqUIPJi9c" },
    ],
  },
  {
    modelYear: 2019,
    manufacturer: "Nissan",
    carModel: "Note e-Power",
    engineSize: 1.2,
    fuelType: "Petrol",
    powertrainType: "Hybrid",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 9.11,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996682/0to100-tracker/PXL_20240203_193501989_soiw5v_j7wljm.jpg" },
      { type: "youtube", path: "zoQQjdn6oaE" },
    ],
  },
  {
    modelYear: 2021,
    manufacturer: "Toyota",
    carModel: "Yaris",
    engineSize: 1.5,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 9.25,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996777/0to100-tracker/PXL_20250914_214815018_ftv6qf_iu26qh.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782997005/0to100-tracker/PXL_20240108_154046214.NIGHT_acbm43_e2ylb6.jpg" },
    ],
  },
  {
    modelYear: 2023,
    manufacturer: "Toyota",
    carModel: "Corolla X Altis Grande",
    engineSize: 1.8,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 9.27,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783009261/0to100-tracker/1000022332_zttc2n.jpg" },
      { type: "youtube", path: "4H0qRncyGqU" },
    ],
  },
  {
    modelYear: 2020,
    manufacturer: "Nissan",
    carModel: "Sentra",
    engineSize: 2.0,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 9.81,
    media: [{ type: "youtube", path: "IAxaSPYKsDQ" }],
  },
  {
    modelYear: 2023,
    manufacturer: "Toyota",
    carModel: "Fortuner Legender",
    engineSize: 2.8,
    fuelType: "Diesel",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "Turbocharged",
    zeroToHundred: 10.04,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996966/0to100-tracker/PXL_20240601_103803148_asbgji_egljl8.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782996966/0to100-tracker/Messenger_creation_1422891069257886_q1srgd_xsqmqe.jpg" },
      { type: "youtube", path: "QmVwdyh6ISQ" },
    ],
  },
  {
    modelYear: 2014,
    manufacturer: "Toyota",
    carModel: "Prius",
    engineSize: 1.8,
    fuelType: "Petrol",
    powertrainType: "Hybrid",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 10.2,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011393/0to100-tracker/20230521_002252_zxkajm.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011393/0to100-tracker/20230521_002312_guimhv.jpg" },
    ],
  },
  {
    modelYear: 2007,
    manufacturer: "Toyota",
    carModel: "Prius",
    engineSize: 1.5,
    fuelType: "Petrol",
    powertrainType: "Hybrid",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 10.51,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782997204/0to100-tracker/PXL_20241028_102423986.PORTRAIT.ORIGINAL_bdqjrq_vrycai.jpg" },
      { type: "video", path: "https://res.cloudinary.com/dtaneeuia/video/upload/v1782997137/0to100-tracker/lv_0_20250930172232_kshmgg_b0hegm.mp4" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782997204/0to100-tracker/PXL_20250325_234428248.PORTRAIT_bvhhi0_ltkor4.jpg" },
    ],
  },
  {
    modelYear: 2022,
    manufacturer: "Hyundai",
    carModel: "Sonata",
    engineSize: 2.5,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 10.74,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011449/0to100-tracker/PXL_20250420_185026091_smw5pi.jpg" },
      { type: "youtube", path: "krP78dZ_T2w" },
    ],
  },
  {
    modelYear: 2021,
    manufacturer: "Hyundai",
    carModel: "Tucson",
    engineSize: 2.0,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 11.39,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782997338/0to100-tracker/PXL_20250216_111758379.PORTRAIT.ORIGINAL_olhpnx_q3litp.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782997339/0to100-tracker/IMG_20220629_183825_vqbsul_va4idf.jpg" },
      { type: "youtube", path: "3kbAES5aTzs" },
    ],
  },
  {
    modelYear: 2026,
    manufacturer: "Changan",
    carModel: "Oshan X7 FutureSense",
    engineSize: 1.5,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "Turbocharged",
    zeroToHundred: 11.47,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011523/0to100-tracker/PXL_20260614_203659628_gy2zdf.jpg" },
      { type: "youtube", path: "yfh5npCiPAQ" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011523/0to100-tracker/PXL_20260614_212148296_wa358y.jpg" },
    ],
  },
  {
    modelYear: 2008,
    manufacturer: "Honda",
    carModel: "Civic",
    engineSize: 1.8,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 11.87,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011599/0to100-tracker/PXL_20251002_113912692.PORTRAIT.ORIGINAL_l1s6t8.jpg" },
      { type: "youtube", path: "BX8UJjXSfdE" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011598/0to100-tracker/PXL_20240919_195611347.PORTRAIT_scmu8x.jpg" },
    ],
  },
  {
    modelYear: 2025,
    manufacturer: "Toyota",
    carModel: "Corolla Cross X",
    engineSize: 1.8,
    fuelType: "Petrol",
    powertrainType: "Hybrid",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 12.27,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011648/0to100-tracker/Snapchat-1703351931_bc4wvj.jpg" },
      { type: "youtube", path: "2qX6utwxFmk" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011648/0to100-tracker/PXL_20250831_101532418_lnd8uw.jpg" },
    ],
  },
  {
    modelYear: 2012,
    manufacturer: "Toyota",
    carModel: "Corolla GLI",
    engineSize: 1.6,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 12.84,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783053694/0to100-tracker/PXL_20250120_130920555.PORTRAIT.ORIGINAL_oiwfwm_x5v2th.jpg" },
      { type: "youtube", path: "DgM-n7iXD7M" },
    ],
  },
  {
    modelYear: 2024,
    manufacturer: "Toyota",
    carModel: "Yaris GLI",
    engineSize: 1.3,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 13.07,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011779/0to100-tracker/PXL_20260515_235716002_jsbncd.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011778/0to100-tracker/PXL_20260511_104534411_df9vdz.jpg" },
      { type: "youtube", path: "0P2vlufNSLw" },
    ],
  },
  {
    modelYear: 2022,
    manufacturer: "Changan",
    carModel: "Alsvin Lumiere",
    engineSize: 1.5,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 13.64,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054169/0to100-tracker/alsvin1_t3hyt7_ki2byo.png" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054169/0to100-tracker/Gemini_Generated_Image_6e2ruv6e2ruv6e2r_bjzupi_ewu33n.png" },
      { type: "youtube", path: "F8aOojY5WxQ" },
    ],
  },
  {
    modelYear: 2018,
    manufacturer: "Toyota",
    carModel: "Corolla GLI",
    engineSize: 1.3,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Manual",
    induction: "NA",
    zeroToHundred: 14.27,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011899/0to100-tracker/PXL_20250427_143917886.PORTRAIT.ORIGINAL_ekeqhk.jpg" },
      { type: "youtube", path: "3OYF58_G0Sk" },
    ],
  },
  {
    modelYear: 2005,
    manufacturer: "Mitsubishi",
    carModel: "Galant",
    engineSize: 2.0,
    fuelType: "Diesel",
    powertrainType: "ICE",
    transmission: "Manual",
    induction: "Turbocharged",
    zeroToHundred: 14.87,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054066/0to100-tracker/PXL_20240208_035148570.PORTRAIT.ORIGINAL_ysx0mp_u9f80f.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054066/0to100-tracker/PXL_20240121_121935110.PORTRAIT_kamijj_oj2yrh.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054066/0to100-tracker/PXL_20240207_155116247_swvlsa_s6ycok.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054066/0to100-tracker/PXL_20240208_035106902.PORTRAIT.ORIGINAL_z4hq2b_kkxbvb.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054066/0to100-tracker/PXL_20240323_123711241.PORTRAIT.ORIGINAL_zkrlvj_atndsb.jpg" },
    ],
  },
  {
    modelYear: 2017,
    manufacturer: "Honda",
    carModel: "City",
    engineSize: 1.3,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 14.87,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783332289/0to100-tracker/Untitled_nao0kp.png" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783332289/0to100-tracker/WhatsApp_Image_2026-07-06_at_2.53.51_PM_feab6q.jpg" },
      { type: "youtube", path: "c8cPTDWXQDs" },
    ],
    specs: [
      { label: "Power", value: "118 hp" },
      { label: "Torque", value: "145 Nm" },
      { label: "Top speed", value: "195 km/h" },
      { label: "Drivetrain", value: "FWD" },
      { label: "Cylinders", value: "4" },
      { label: "Fuel economy", value: "5.7 L/100km (combined)" },
      { label: "Kerb weight", value: "1110 kg" },
      { label: "Length", value: "4440 mm" },
      { label: "Width", value: "1695 mm" },
      { label: "Height", value: "1485 mm" },
      { label: "Wheelbase", value: "2600 mm" },
      { label: "Boot space", value: "536 L" },
      { label: "Seating capacity", value: "5" },
      { label: "Doors", value: "4" },
      { label: "Body type", value: "Sedan" },
      { label: "Tyre size", value: "185/55 R16" },
      { label: "Fuel tank", value: "40 L" },
    ],
    features: [
      "Automatic climate control",
      "LED Daytime Running Lights (DRLs)",
      "Alloy wheels",
      "Anti-lock Braking System (ABS)",
      "Electronic Brakeforce Distribution (EBD)",
      "Dual front airbags",
    ],
    notes:
      "This test was conducted by Kensu. As he does not know how to race a launch a manual car, the launch was slower than optimal, hence the slow time.",
  },
  {
    modelYear: 2016,
    manufacturer: "Toyota",
    carModel: "Corolla GLI",
    engineSize: 1.3,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 14.94,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011957/0to100-tracker/DSC_7132_kamd36.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783011957/0to100-tracker/PXL_20251002_114104638.PORTRAIT_hqnyux.jpg" },
      { type: "youtube", path: "kij7mKnt7YE" },
    ],
  },
  {
    modelYear: 2012,
    manufacturer: "Honda",
    carModel: "City",
    engineSize: 1.3,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Manual",
    induction: "NA",
    zeroToHundred: 18.01,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783012013/0to100-tracker/Snapchat-1540693033_axrice.jpg" },
      { type: "youtube", path: "SYDUgs_jhOU" },
    ],
    notes:
      "This test was conducted by Kensu. As he does not know how to race a launch a manual car, the launch was slower than optimal, hence the slow time.",
  },
  {
    modelYear: 2014,
    manufacturer: "Daihatsu",
    carModel: "Mira",
    engineSize: 0.6,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 18.02,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054407/0to100-tracker/1000065411_eugjlk_tjsi8a.png" },
      { type: "youtube", path: "GGFFfsy-G_A" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054401/0to100-tracker/397f0e529a0e42af853ddaeba5e6accc_grymoz_b4pn0l.jpg" },
    ],
  },
  {
    modelYear: 2007,
    manufacturer: "Toyota",
    carModel: "Passo",
    engineSize: 1.0,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 18.21,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054307/0to100-tracker/PXL_20251109_151155037.PORTRAIT_yygfbj_axlbyj.jpg" },
      { type: "youtube", path: "mUH2WTLKo0k" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054296/0to100-tracker/PXL_20260408_085810036_drbyzn_rgs4di.jpg" },
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054297/0to100-tracker/PXL_20260408_085810036_drbyzn_fb85yu_steh2h.jpg" },
    ],
  },
  {
    modelYear: 2011,
    manufacturer: "Subaru",
    carModel: "Pleo",
    engineSize: 0.6,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 18.92,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782995318/0to100-tracker/1000065472_vo58w5.jpg" },
      { type: "youtube", path: "ATtH0IPYKus" },
    ],
  },
  {
    modelYear: 2009,
    manufacturer: "Toyota",
    carModel: "Vitz",
    engineSize: 1.0,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Auto",
    induction: "NA",
    zeroToHundred: 19.24,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1782995468/0to100-tracker/1000065417_ivkb64.jpg" },
      { type: "youtube", path: "1VBfbeqTWqQ" },
    ],
  },
  {
    modelYear: 2014,
    manufacturer: "Suzuki",
    carModel: "Mehran",
    engineSize: 0.6,
    fuelType: "Petrol",
    powertrainType: "ICE",
    transmission: "Manual",
    induction: "NA",
    zeroToHundred: 33.21,
    media: [
      { type: "image", path: "https://res.cloudinary.com/dtaneeuia/image/upload/v1783054518/0to100-tracker/Snapchat-2117041757_p3giaf.jpg" },
      { type: "youtube", path: "BEwActw18Ag" },
    ],
    notes:
      "This test was conducted with four occupants in the car, so the recorded time is slightly slower than expected due to the additional weight.",
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "✗ MONGODB_URI is not set. Copy .env.example to .env.local and set it."
    );
    process.exit(1);
  }

  const force =
    process.argv.includes("--force") || process.env.SEED_FORCE === "1";

  console.log("→ Connecting to MongoDB…");
  await mongoose.connect(uri);

  // Safety guard: seeding wipes the whole collection, so never run against a
  // populated database unless the caller explicitly opts in with --force.
  const existing = await Car.countDocuments();
  if (existing > 0 && !force) {
    console.error(
      `\n✗ Refusing to seed: ${existing} car${existing === 1 ? "" : "s"} already in the database.\n` +
        "  Seeding clears the ENTIRE cars collection first — this would delete them.\n\n" +
        `  If you really want to wipe everything and reload the ${CARS.length} sample cars, run:\n` +
        "    npm run seed -- --force   (or set SEED_FORCE=1)\n"
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  if (existing > 0) {
    console.log(`→ --force set: clearing ${existing} existing cars…`);
  }
  await Car.deleteMany({});

  console.log(`→ Inserting ${CARS.length} cars…`);
  await Car.insertMany(CARS.map((c) => ({ ...c, media: c.media ?? [] })));

  const count = await Car.countDocuments();
  console.log(`✓ Seed complete — ${count} cars on the grid.`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("✗ Seed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
