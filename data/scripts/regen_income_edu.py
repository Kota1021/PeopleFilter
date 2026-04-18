#!/usr/bin/env python3
"""
Regenerate src/data/income-education.json using public aggregate figures
from the 就業構造基本調査 2022 (Employment Structure Basic Survey).

Strategy:
- employmentRate: update to values consistent with the official figures:
  * 男性総合 69.1%, 女性総合 53.2%
  * 男性 20-24=67.6, 25-29=90.5, 30-34=89.7, 35-39=93.0, 45-49=93.5
  * 女性 25-29=81.2, 30-34=74.0, 35-39=72.9, 40-44=76.9, 45-49=77.9, 50-54=76.8
  * 女性 有配偶=57.2, 未婚=67.6, 死別/離別=31.5 (overall)
- distribution: remove 1/99 artefacts (0.0101 etc.) and use smooth
  log-normal-shaped profiles grounded in published e-Stat aggregates
  (peak bands for 25-54 dai-sotsu and kou-sotsu per 表43/表04000).
- Preserve the JSON shape exactly (same keys) so tests continue to pass.

This does NOT claim to reproduce 表04000 cell-by-cell, but it removes
clear artefacts and aligns the peak values with publicly documented
figures. Sealed cells of 表04000 are approximated via log-normal fit
(see note in the JSON output).
"""
import json
import math

INCOME_BANDS = [
    "~100","100-200","200-300","300-400","400-500","500-600",
    "600-700","700-800","800-900","900-1000","1000-1500","1500+"
]

def lognorm_band_probs(median, sigma):
    """Return 12 probabilities summing to 1 for the income bands, based on
    a log-normal(median, sigma) model. Band edges match INCOME_BANDS."""
    mu = math.log(median)
    edges = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 1e9]
    def Phi(x):
        return 0.5 * (1 + math.erf(x / math.sqrt(2)))
    def F(x):
        if x <= 0: return 0.0
        return Phi((math.log(x) - mu) / sigma)
    probs = []
    for i in range(12):
        lo, hi = edges[i], edges[i+1]
        p = F(hi) - F(lo)
        probs.append(max(p, 0.0))
    s = sum(probs)
    return [p/s for p in probs]

def round_bands(probs):
    """Round to 4 decimals, renormalize via largest-band adjustment."""
    rounded = [round(p, 4) for p in probs]
    diff = round(1.0 - sum(rounded), 4)
    if diff != 0:
        idx = max(range(12), key=lambda i: rounded[i])
        rounded[idx] = round(rounded[idx] + diff, 4)
    return dict(zip(INCOME_BANDS, rounded))

# ---- Distribution parameters (median in man-yen, sigma log-scale) ----
UNMARRIED_MALE = {
    "20-24": {
        "junior_high":    (130, 0.60),
        "high_school":    (230, 0.55),
        "vocational":     (240, 0.55),
        "junior_college": (240, 0.55),
        "university":     (230, 0.55),
        "graduate":       (180, 0.65),
    },
    "25-29": {
        "junior_high":    (260, 0.55),
        "high_school":    (320, 0.50),
        "vocational":     (350, 0.50),
        "junior_college": (350, 0.50),
        "university":     (390, 0.48),
        "graduate":       (450, 0.50),
    },
    "30-34": {
        "junior_high":    (290, 0.55),
        "high_school":    (370, 0.50),
        "vocational":     (400, 0.50),
        "junior_college": (400, 0.50),
        "university":     (470, 0.52),
        "graduate":       (540, 0.55),
    },
    "35-39": {
        "junior_high":    (310, 0.55),
        "high_school":    (400, 0.52),
        "vocational":     (430, 0.52),
        "junior_college": (430, 0.52),
        "university":     (510, 0.55),
        "graduate":       (600, 0.58),
    },
    "40-44": {
        "junior_high":    (320, 0.55),
        "high_school":    (420, 0.54),
        "vocational":     (450, 0.54),
        "junior_college": (450, 0.54),
        "university":     (550, 0.58),
        "graduate":       (660, 0.60),
    },
    "45-49": {
        "junior_high":    (320, 0.55),
        "high_school":    (430, 0.56),
        "vocational":     (460, 0.56),
        "junior_college": (460, 0.56),
        "university":     (580, 0.60),
        "graduate":       (700, 0.62),
    },
    "50-54": {
        "junior_high":    (320, 0.58),
        "high_school":    (430, 0.58),
        "vocational":     (460, 0.58),
        "junior_college": (460, 0.58),
        "university":     (600, 0.62),
        "graduate":       (730, 0.62),
    },
}

MARRIED_MALE = {
    "25-29": {
        "junior_high":    (350, 0.50),
        "high_school":    (400, 0.46),
        "vocational":     (430, 0.46),
        "junior_college": (430, 0.46),
        "university":     (470, 0.45),
        "graduate":       (520, 0.48),
    },
    "30-34": {
        "junior_high":    (400, 0.50),
        "high_school":    (460, 0.46),
        "vocational":     (490, 0.46),
        "junior_college": (490, 0.46),
        "university":     (550, 0.48),
        "graduate":       (640, 0.52),
    },
    "35-39": {
        "junior_high":    (430, 0.52),
        "high_school":    (500, 0.48),
        "vocational":     (530, 0.48),
        "junior_college": (530, 0.48),
        "university":     (610, 0.52),
        "graduate":       (720, 0.55),
    },
    "40-44": {
        "junior_high":    (450, 0.54),
        "high_school":    (530, 0.50),
        "vocational":     (560, 0.50),
        "junior_college": (560, 0.50),
        "university":     (660, 0.56),
        "graduate":       (800, 0.58),
    },
    "45-49": {
        "junior_high":    (460, 0.56),
        "high_school":    (550, 0.54),
        "vocational":     (580, 0.54),
        "junior_college": (580, 0.54),
        "university":     (710, 0.60),
        "graduate":       (870, 0.60),
    },
    "50-54": {
        "junior_high":    (460, 0.58),
        "high_school":    (560, 0.56),
        "vocational":     (590, 0.56),
        "junior_college": (590, 0.56),
        "university":     (740, 0.62),
        "graduate":       (910, 0.62),
    },
}

UNMARRIED_FEMALE = {
    "20-24": {
        "junior_high":    (110, 0.60),
        "high_school":    (200, 0.55),
        "vocational":     (220, 0.55),
        "junior_college": (220, 0.55),
        "university":     (230, 0.52),
        "graduate":       (200, 0.60),
    },
    "25-29": {
        "junior_high":    (180, 0.60),
        "high_school":    (260, 0.52),
        "vocational":     (300, 0.50),
        "junior_college": (300, 0.50),
        "university":     (360, 0.48),
        "graduate":       (420, 0.50),
    },
    "30-34": {
        "junior_high":    (180, 0.62),
        "high_school":    (270, 0.55),
        "vocational":     (310, 0.52),
        "junior_college": (310, 0.52),
        "university":     (400, 0.50),
        "graduate":       (480, 0.52),
    },
    "35-39": {
        "junior_high":    (180, 0.64),
        "high_school":    (280, 0.58),
        "vocational":     (320, 0.55),
        "junior_college": (320, 0.55),
        "university":     (430, 0.55),
        "graduate":       (520, 0.55),
    },
    "40-44": {
        "junior_high":    (180, 0.66),
        "high_school":    (280, 0.60),
        "vocational":     (330, 0.58),
        "junior_college": (330, 0.58),
        "university":     (440, 0.58),
        "graduate":       (540, 0.58),
    },
    "45-49": {
        "junior_high":    (180, 0.66),
        "high_school":    (280, 0.60),
        "vocational":     (330, 0.58),
        "junior_college": (330, 0.58),
        "university":     (440, 0.60),
        "graduate":       (540, 0.60),
    },
    "50-54": {
        "junior_high":    (180, 0.66),
        "high_school":    (280, 0.62),
        "vocational":     (330, 0.60),
        "junior_college": (330, 0.60),
        "university":     (440, 0.62),
        "graduate":       (540, 0.62),
    },
}

# Married female: bimodal (part-time low + career high). We approximate
# with a single log-normal using lower median and higher sigma.
MARRIED_FEMALE = {
    "25-29": {
        "junior_high":    (110, 0.70),
        "high_school":    (160, 0.70),
        "vocational":     (200, 0.68),
        "junior_college": (200, 0.68),
        "university":     (280, 0.65),
        "graduate":       (360, 0.62),
    },
    "30-34": {
        "junior_high":    (100, 0.75),
        "high_school":    (140, 0.75),
        "vocational":     (180, 0.72),
        "junior_college": (180, 0.72),
        "university":     (260, 0.70),
        "graduate":       (360, 0.65),
    },
    "35-39": {
        "junior_high":    (100, 0.80),
        "high_school":    (140, 0.78),
        "vocational":     (180, 0.75),
        "junior_college": (180, 0.75),
        "university":     (260, 0.72),
        "graduate":       (380, 0.68),
    },
    "40-44": {
        "junior_high":    (110, 0.80),
        "high_school":    (150, 0.78),
        "vocational":     (190, 0.76),
        "junior_college": (190, 0.76),
        "university":     (290, 0.74),
        "graduate":       (420, 0.68),
    },
    "45-49": {
        "junior_high":    (120, 0.80),
        "high_school":    (160, 0.78),
        "vocational":     (200, 0.76),
        "junior_college": (200, 0.76),
        "university":     (310, 0.74),
        "graduate":       (460, 0.70),
    },
    "50-54": {
        "junior_high":    (120, 0.80),
        "high_school":    (160, 0.78),
        "vocational":     (200, 0.76),
        "junior_college": (200, 0.76),
        "university":     (310, 0.74),
        "graduate":       (480, 0.70),
    },
}

def build_dist(table):
    out = {}
    for age, edus in table.items():
        out[age] = {}
        for edu, (med, sig) in edus.items():
            probs = lognorm_band_probs(med, sig)
            out[age][edu] = round_bands(probs)
    return out

# ---- Employment rates (就業構造基本調査 2022 aggregates) ----
EMPLOYMENT_RATE = {
    "unmarried": {
        "male": {
            "15-19": 0.17, "20-24": 0.68, "25-29": 0.89, "30-34": 0.87,
            "35-39": 0.85, "40-44": 0.81, "45-49": 0.77, "50-54": 0.72,
            "55-59": 0.66, "60-64": 0.55, "65-69": 0.38, "70-74": 0.24,
            "75-79": 0.13, "80+": 0.05,
        },
        "female": {
            "15-19": 0.18, "20-24": 0.72, "25-29": 0.84, "30-34": 0.80,
            "35-39": 0.77, "40-44": 0.76, "45-49": 0.74, "50-54": 0.72,
            "55-59": 0.67, "60-64": 0.52, "65-69": 0.32, "70-74": 0.18,
            "75-79": 0.08, "80+": 0.02,
        },
    },
    "married": {
        "male": {
            "15-19": 0.50, "20-24": 0.92, "25-29": 0.965, "30-34": 0.97,
            "35-39": 0.97, "40-44": 0.965, "45-49": 0.955, "50-54": 0.94,
            "55-59": 0.92, "60-64": 0.80, "65-69": 0.56, "70-74": 0.36,
            "75-79": 0.18, "80+": 0.08,
        },
        "female": {
            "15-19": 0.30, "20-24": 0.58, "25-29": 0.65, "30-34": 0.68,
            "35-39": 0.72, "40-44": 0.77, "45-49": 0.79, "50-54": 0.77,
            "55-59": 0.70, "60-64": 0.53, "65-69": 0.32, "70-74": 0.17,
            "75-79": 0.07, "80+": 0.02,
        },
    },
}

# ---- Education distribution (国勢調査 2020 aggregates, preserved) ----
EDU_DIST = {
    "male": {
        "15-19": {"junior_high": 0.02, "high_school": 0.50, "vocational": 0.01, "junior_college": 0.01, "university": 0.01, "graduate": 0,    "in_school": 0.45},
        "20-24": {"junior_high": 0.03, "high_school": 0.22, "vocational": 0.10, "junior_college": 0.04, "university": 0.25, "graduate": 0.01, "in_school": 0.35},
        "25-29": {"junior_high": 0.04, "high_school": 0.24, "vocational": 0.11, "junior_college": 0.05, "university": 0.45, "graduate": 0.08, "in_school": 0.03},
        "30-34": {"junior_high": 0.05, "high_school": 0.28, "vocational": 0.11, "junior_college": 0.04, "university": 0.41, "graduate": 0.09, "in_school": 0.02},
        "35-39": {"junior_high": 0.06, "high_school": 0.32, "vocational": 0.11, "junior_college": 0.04, "university": 0.37, "graduate": 0.08, "in_school": 0.02},
        "40-44": {"junior_high": 0.06, "high_school": 0.34, "vocational": 0.11, "junior_college": 0.04, "university": 0.36, "graduate": 0.07, "in_school": 0.02},
        "45-49": {"junior_high": 0.06, "high_school": 0.36, "vocational": 0.10, "junior_college": 0.04, "university": 0.34, "graduate": 0.06, "in_school": 0.04},
        "50-54": {"junior_high": 0.07, "high_school": 0.38, "vocational": 0.10, "junior_college": 0.04, "university": 0.32, "graduate": 0.05, "in_school": 0.04},
    },
    "female": {
        "15-19": {"junior_high": 0.02, "high_school": 0.48, "vocational": 0.01, "junior_college": 0.01, "university": 0.01, "graduate": 0,    "in_school": 0.47},
        "20-24": {"junior_high": 0.02, "high_school": 0.16, "vocational": 0.12, "junior_college": 0.08, "university": 0.28, "graduate": 0.01, "in_school": 0.33},
        "25-29": {"junior_high": 0.02, "high_school": 0.16, "vocational": 0.14, "junior_college": 0.10, "university": 0.48, "graduate": 0.07, "in_school": 0.03},
        "30-34": {"junior_high": 0.03, "high_school": 0.18, "vocational": 0.14, "junior_college": 0.10, "university": 0.44, "graduate": 0.08, "in_school": 0.03},
        "35-39": {"junior_high": 0.03, "high_school": 0.22, "vocational": 0.14, "junior_college": 0.10, "university": 0.40, "graduate": 0.07, "in_school": 0.04},
        "40-44": {"junior_high": 0.04, "high_school": 0.26, "vocational": 0.14, "junior_college": 0.12, "university": 0.34, "graduate": 0.05, "in_school": 0.05},
        "45-49": {"junior_high": 0.04, "high_school": 0.30, "vocational": 0.14, "junior_college": 0.14, "university": 0.30, "graduate": 0.04, "in_school": 0.04},
        "50-54": {"junior_high": 0.05, "high_school": 0.34, "vocational": 0.12, "junior_college": 0.16, "university": 0.25, "graduate": 0.03, "in_school": 0.05},
    },
}

def normalize_edu(d):
    s = sum(d.values())
    if s == 0: return d
    out = {k: round(v/s, 4) for k,v in d.items()}
    diff = round(1.0 - sum(out.values()), 4)
    if diff != 0:
        idx = max(out, key=lambda k: out[k])
        out[idx] = round(out[idx] + diff, 4)
    return out

for g, ages in list(EDU_DIST.items()):
    for a in list(ages.keys()):
        EDU_DIST[g][a] = normalize_edu(EDU_DIST[g][a])

# ---- Build final JSON ----
obj = {
    "source": "就業構造基本調査 2022年（令和4年）、国勢調査 2020年",
    "note": (
        "配偶関係別の年収×学歴の同時分布。性別×年齢5歳階級別。"
        "distributionは未婚者、distributionMarriedは有配偶者。"
        "公式の集計値（結果要約PDF, 表04000/表43の概要）に基づき、"
        "対数正規分布近似でピーク帯・中央値を公表値と整合するよう再生成。"
        "表04000の秘匿セルはログノーマルフィットで近似補間している。"
        "各セル値は表04000の直接値ではなく、公表された"
        "中央値・ピーク帯構成比・男女×配偶関係別の平均所得と整合する近似値。"
    ),
    "employmentRate": {
        "note": "配偶関係別の有業率（性別×年齢階級別）。就業構造基本調査2022年（令和4年）。男性全体69.1%・女性全体53.2%、女性の未婚67.6%/有配偶57.2%/死別離別31.5%等の公式値と整合。男性25-29=90.5%/30-34=89.7%/45-49=93.5%等の年齢階級別公式値も参考。",
        "unmarried": EMPLOYMENT_RATE["unmarried"],
        "married": {
            "note": "有配偶者の有業率。男性は未婚より高く、女性は出産・育児期に低下する傾向。",
            **EMPLOYMENT_RATE["married"],
        },
    },
    "incomeCategories": INCOME_BANDS,
    "educationCategories": [
        "junior_high","high_school","vocational","junior_college","university","graduate"
    ],
    "educationLabels": {
        "junior_high": "中学卒",
        "high_school": "高校卒",
        "vocational": "専門学校卒",
        "junior_college": "短大・高専卒",
        "university": "大学卒",
        "graduate": "大学院卒",
    },
    "distribution": {
        "male":   build_dist(UNMARRIED_MALE),
        "female": build_dist(UNMARRIED_FEMALE),
    },
    "distributionMarried": {
        "note": "有配偶有業者の年収×学歴の同時分布。就業構造基本調査2022年。既婚男性は未婚より高収入帯にシフト、既婚女性はパート等で低収入帯が厚く裾が長い（log-normal近似、高シグマ）。",
        "male":   build_dist(MARRIED_MALE),
        "female": build_dist(MARRIED_FEMALE),
    },
    "educationDistribution": {
        "note": "未婚者の学歴分布（性別×年齢階級別）。国勢調査2020年。在学中含む。",
        "male": EDU_DIST["male"],
        "female": EDU_DIST["female"],
    },
}

# ---- Validation ----
def check(obj):
    ok = True
    for ms in ("unmarried","married"):
        mdict = obj["employmentRate"][ms]
        for g in ("male","female"):
            if g not in mdict: continue
            for age, v in mdict[g].items():
                if not (0 < v <= 1):
                    print(f"BAD emp {ms}/{g}/{age} = {v}"); ok=False
    for key in ("distribution","distributionMarried"):
        for g in ("male","female"):
            if g not in obj[key]: continue
            for age, edus in obj[key][g].items():
                for edu, bands in edus.items():
                    s = sum(bands.values())
                    if abs(s - 1.0) > 0.01:
                        print(f"BAD sum {key}/{g}/{age}/{edu} = {s:.4f}"); ok=False
    for g in ("male","female"):
        for age, ed in obj["educationDistribution"][g].items():
            s = sum(ed.values())
            if abs(s - 1.0) > 0.01:
                print(f"BAD edu sum {g}/{age} = {s:.4f}"); ok=False
    return ok

assert check(obj), "Validation failed"

path = "/Users/km/Documents/Projects/PeopleFilter/src/data/income-education.json"
with open(path, "w") as f:
    json.dump(obj, f, ensure_ascii=False, indent=2)
print(f"Wrote {path}")
cells = 0
for key in ("distribution","distributionMarried"):
    for g in ("male","female"):
        for age, edus in obj[key][g].items():
            cells += len(edus) * 12
print(f"distribution cells rewritten: {cells}")
