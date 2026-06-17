import type { WorkspaceState } from "@/types/market";

export const sampleWorkspace: WorkspaceState = {
  project: {
    brandName: "오딧세이",
    productName: "블랙 스페셜 2종 세트",
    category: "남성 스킨케어",
    priceRange: "45,000원 ~ 60,000원",
    productFeatures:
      "안티에이징·탄력 케어, 올인원에 가까운 간편한 2단계 루틴, 묵직한 우디 향, 프리미엄 블랙 패키지",
    currentTarget: "피부 관리에 관심이 생긴 30~40대 직장인 남성",
    marketingGoal:
      "브랜드 노후 이미지를 개선하고 35~44세 남성의 신규 구매 및 선물 수요를 확대",
  },
  targets: [
    {
      id: "target-1",
      segmentName: "관리 시작형 3040 직장인",
      ageRange: "32~44세",
      gender: "남성",
      occupation: "대기업·전문직·사무직",
      lifestyle:
        "업무와 모임이 잦고 외모가 신뢰감에 영향을 준다고 생각하지만, 복잡한 스킨케어에는 부담을 느낌",
      painPoints:
        "칙칙함과 탄력 저하, 면도 후 건조함, 무엇을 발라야 할지 모르는 번거로움",
      purchaseMotivation:
        "적은 단계로 깔끔한 인상을 만들고 싶음, 검증된 대기업 브랜드에 대한 신뢰",
      purchaseBarriers:
        "올드한 브랜드 이미지, 즉각적인 효능 체감에 대한 의문, 온라인 후기 부족",
      mediaChannels: "유튜브, 네이버 검색, 카카오톡 선물하기, 인스타그램",
      score: {
        painIntensity: 5,
        purchasingPower: 5,
        productNeed: 5,
        adReachability: 4,
        repeatPotential: 4,
      },
    },
    {
      id: "target-2",
      segmentName: "센스 있는 파트너 선물 구매자",
      ageRange: "28~42세",
      gender: "여성 중심",
      occupation: "직장인·프리랜서",
      lifestyle:
        "기념일과 명절에 실용적이면서도 패키지가 고급스러운 선물을 탐색",
      painPoints:
        "남성 화장품 취향을 알기 어렵고 실패 없는 선물 선택지가 부족함",
      purchaseMotivation:
        "인지도 있는 브랜드, 선물하기 좋은 구성, 프리미엄 패키지",
      purchaseBarriers:
        "받는 사람이 실제로 사용할지 불확실함, 향에 대한 호불호",
      mediaChannels: "카카오톡 선물하기, 네이버 쇼핑, 인스타그램, 백화점몰",
      score: {
        painIntensity: 4,
        purchasingPower: 4,
        productNeed: 4,
        adReachability: 5,
        repeatPotential: 3,
      },
    },
    {
      id: "target-3",
      segmentName: "그루밍 고관여 20대 후반",
      ageRange: "26~32세",
      gender: "남성",
      occupation: "스타트업·크리에이티브 직군",
      lifestyle:
        "성분과 리뷰를 비교하고 향수·패션·그루밍 제품으로 자신을 표현",
      painPoints:
        "남성 전용 제품의 낮은 성분 기대치, 획일적인 아저씨 이미지",
      purchaseMotivation:
        "감각적인 브랜드 경험, 피부 효능 데이터, SNS에서 공유할 만한 디자인",
      purchaseBarriers:
        "브랜드 세대감, 더 전문적인 더마·인디 브랜드 대안이 많음",
      mediaChannels: "유튜브, 인스타그램, 올리브영, 무신사",
      score: {
        painIntensity: 3,
        purchasingPower: 3,
        productNeed: 3,
        adReachability: 5,
        repeatPotential: 4,
      },
    },
  ],
  competitors: [
    {
      id: "competitor-1",
      competitorName: "헤라 옴므",
      productName: "에센스 인 스킨·에멀전",
      priceRange: "70,000원 ~ 95,000원",
      usp: "세련된 프리미엄 남성 이미지와 아모레퍼시픽의 피부 과학",
      target: "외모 관리와 브랜드 이미지를 중시하는 30~40대 남성",
      strengths: "높은 인지도, 백화점 유통, 세련된 모델·비주얼, 선물 적합성",
      weaknesses: "높은 가격대, 기능 차별성이 직관적으로 전달되지 않음",
      channels: "백화점, 브랜드몰, 카카오 선물하기, 네이버, 유튜브",
      messageTone: "도시적이고 절제된 프리미엄",
      positionX: 58,
      positionY: 86,
      score: {
        brandAwareness: 5,
        productSimilarity: 5,
        priceCompetitiveness: 3,
        channelPower: 5,
        messageClarity: 4,
      },
    },
    {
      id: "competitor-2",
      competitorName: "비오템 옴므",
      productName: "아쿠아파워 어드밴스드 젤",
      priceRange: "65,000원 ~ 90,000원",
      usp: "남성 피부에 특화된 강력한 수분 충전과 글로벌 전문성",
      target: "운동과 자기관리를 즐기는 25~40대 남성",
      strengths: "남성 전문 이미지, 명확한 수분 효익, 글로벌 프리미엄 인지도",
      weaknesses: "단품 중심의 높은 가격, 선물 세트 접근성 제한",
      channels: "백화점, 면세점, 온라인몰, 인스타그램, 유튜브",
      messageTone: "에너지 넘치고 과학적인 남성 전문",
      positionX: 84,
      positionY: 90,
      score: {
        brandAwareness: 4,
        productSimilarity: 4,
        priceCompetitiveness: 3,
        channelPower: 4,
        messageClarity: 5,
      },
    },
    {
      id: "competitor-3",
      competitorName: "아이오페 맨",
      productName: "바이오 2종",
      priceRange: "48,000원 ~ 68,000원",
      usp: "피부 과학 기반의 기능성 안티에이징 남성 케어",
      target: "효능과 가성비를 함께 보는 35~50대 남성",
      strengths: "기능성 신뢰, 유사 가격대, 폭넓은 온라인 유통",
      weaknesses: "감성적 매력과 트렌디한 브랜드 화제성이 낮음",
      channels: "아리따움, 브랜드몰, 네이버, 홈쇼핑",
      messageTone: "신뢰감 있고 기능 중심",
      positionX: 88,
      positionY: 65,
      score: {
        brandAwareness: 4,
        productSimilarity: 5,
        priceCompetitiveness: 4,
        channelPower: 4,
        messageClarity: 4,
      },
    },
    {
      id: "competitor-4",
      competitorName: "랩시리즈",
      productName: "올인원 멀티 액션 훼이스 워시·로션",
      priceRange: "55,000원 ~ 85,000원",
      usp: "남성을 위한 간편하고 전문적인 올인원 그루밍 솔루션",
      target: "간편함과 전문성을 원하는 25~40대 남성",
      strengths: "명확한 남성 전문성, 올인원 편의성, 젊은 브랜드 인상",
      weaknesses: "대중 인지도가 상대적으로 낮고 오프라인 접근성이 제한적",
      channels: "백화점, 공식몰, 올리브영 일부, 유튜브",
      messageTone: "실용적이고 전문적인 모던 그루밍",
      positionX: 76,
      positionY: 72,
      score: {
        brandAwareness: 3,
        productSimilarity: 4,
        priceCompetitiveness: 3,
        channelPower: 3,
        messageClarity: 5,
      },
    },
  ],
  positioning: {
    xAxisId: "fashionFunction",
    yAxisId: "massPremium",
    brand: {
      x: 84,
      y: 74,
      usp: "간편한 2단계 루틴으로 완성하는 3040 남성의 슬로우에이징 케어",
      strengths:
        "안티에이징과 탄력 케어, 오랜 남성 화장품 노하우, 프리미엄 블랙 패키지",
      weaknesses:
        "기존 브랜드의 올드한 이미지, 젊은 고객층의 낮은 화제성, 효능 근거 커뮤니케이션 부족",
    },
  },
};

export function normalizeWorkspace(
  saved: Partial<WorkspaceState>,
): WorkspaceState {
  const isLegacyPositioning = !saved.positioning;

  return {
    project: {
      ...sampleWorkspace.project,
      ...saved.project,
    },
    targets: saved.targets ?? sampleWorkspace.targets,
    competitors: (saved.competitors ?? sampleWorkspace.competitors).map(
      (competitor, index) => {
        const sampleCompetitor =
          sampleWorkspace.competitors.find(
            (item) => item.id === competitor.id,
          ) ??
          sampleWorkspace.competitors[
            index % sampleWorkspace.competitors.length
          ];

        return {
          ...sampleCompetitor,
          ...competitor,
          positionX: isLegacyPositioning
            ? sampleCompetitor.positionX
            : typeof competitor.positionX === "number"
              ? competitor.positionX
              : 50,
          positionY: isLegacyPositioning
            ? sampleCompetitor.positionY
            : typeof competitor.positionY === "number"
              ? competitor.positionY
              : 50,
        };
      },
    ),
    positioning: {
      ...sampleWorkspace.positioning,
      ...saved.positioning,
      brand: {
        ...sampleWorkspace.positioning.brand,
        ...saved.positioning?.brand,
      },
    },
  };
}
