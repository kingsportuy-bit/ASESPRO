type PropertyVisual = {
  cover: string;
  gallery: string[];
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";

const FALLBACK_GALLERY = [
  "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
];

const VISUALS_BY_ID: Record<string, PropertyVisual> = {
  "prop-1": {
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCmHk5otzJvwsplQBeI4xSVRGzyrjFZF3zoP7xm4ftZzPP9fJSMj0ZF_DazgWYIZHy3pdY42YtyIHodBbEe0q3TzLkD1YiZtWyakuxUDgf_DR0KEeYd_SNPOdyGvRM1X19ncTOSEmwxA87dRL91tFXOTRCP55MjBmFyN0sCm2OW3hVcB39cAqKviSOd745CgMwwj4Zt51XGZ53SZDp-o6Gx0e24M9mo12AE7sAmAsx8dQdgsB3ctT3NyF8Fq3J0Gh275VtvHUEsotU",
    gallery: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAO_mzpFZWJYax9hMOajimKaptn8Cy3HT8sj3hBYvWoMNzsx-j8IzJxeB80NMIxEyCwrWhiglgtCQki8nH1jdJMorqkpLREPHw6udklsw6jlRfrd4JxHwYptdIxnmSLhbT124SRCXnGgEYb4SSDIjRys6JOEj7Q5kPHgm8lifqeLxmoOQN2WueXXI3jNxnBzVmbbqO6WZFjRhV0-KW5gsfc6GEOsXZSD9zOADhF0Z--MBn_pHYvJqh0GBMCQ5GjkOQ2yhYueEgshXo",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDaJtBZxMuBNJZ6qrL0bI6XFJkCRCPZeqno0ea1cOf1RmBaNFv2E-GV9zlsv5MN-Hn8AP8UGG_6K2u_ugbyMKsYI8ljh9XnFFDdga0soWA-TUgcwWv2MQ4Jqk5Z-wJIjSr5aMU_msubHkfN1s18-qxJZc6wOGTNDNrg_p-2a1pbIvMKPeo-PPAYXFg8iJpsaNhWf6ZWLkOIyrBdPGhJ3-DmROeFRqda0vu2ApsLRqeE0pA7exQeC5XeIre_YnGuO6Ysl0cSAerIaQQ",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB2gF3jgRjSEwCeIDFLZRLS87YHHuhxdgDZ7js21wdMwFAlbZUtl6H6KhXdIvsd2tAnTDBUbCSc9bCEen5V0EMwrahJp-i9ZqcHi0-AaOIxeb_8MLQEMuyXFAzy3ESp0V9MisGIcWOS3a3rtdVPu1bIIjScYDd5wtj42mzuEJx2JE28_zmcuyTKwjZ1daHPzypPDPr1p3oQsUqbbMzfZ_MEW1BL3u-Va36ebKLIIGQZzSlnxGkb4ihoo5xTfMsB2pPVlEMBbd8p9u0",
    ],
  },
  "prop-2": {
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDpsTrZkQap9KEcPVY9HpAtP2pM8AbE_Nt9FN0qbiBKZf2CAvIOtyAGG2vB5xZGTQR5JXXD82lCskXG_fQXbc2LcmdLemMSByMG0G-9vLo5MNFuwEDZV_bTtVs0dUQ4LsQwjtVs41O00N4DFKiLsM1G9ub3kSiEVhiWtBoVi1pywMBAZe-sbvx23-WiPC8fL-4t9owb8kPecz08W5_i8srGnF4TMVUUCFq9it9fjC3_ZX5uuzuKfpiosJBLHAmdAF5vnRdulB8ru0I",
    gallery: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA1KBj81MfrYB_Y7F3VEuJvoymGnFpvn3HVHDpNQffhw0UEypeOa5AF11WZyJ4fvtx4JbVKP3PF1rZ55o2GI3dCS61spch_YjcKQlK4Ri_GkQ6fhWTvxon0jD2YRgCo5UfaFYtXc7jxymJ4TPFptwqXOmou2hvqESNGikWT6mB77u-__vx17dwpbJDuttUSr3jrP9a6oqspdU2vzsrZIX5uRQCXnKFlvzlLA2V_IWzE0FtDZ5YAOkGepOQOZkGmzaoYwu5Vx9nTdww",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtJKodIcXzKEkeQ42o1ICXIQQIOTURIN6XmTQ8LOqOa8D_yfE0kXDuHwbus30CRa3j3-2qcbOInt6YpTjiESojfZu9_0M-U87rOFjg3NnA7csyWCkpzOLEtRl6atuYDpqa_v7h4lSAoh02A6cGy-XQjwTVpBUs62HeftC4ncs0qvR2G2ay0SEGst6MiqwjwVO_iPIZMAqvdYpzUHD0wQuGRLaGTI1w251s2UuJMeMyST-l8tF9HVJCZgpRmErOu4dlaTSwCfB-_H8",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAwIXvkpjzcE_S5P7Psu1HXBb3LkiF9mXOiQEwJa6BqvwAnm4ZPyLef2pCGrlJwzziXyS2ItEG5FCEUkW-kie58C_jS4FRpDFXdFk3dKQ0wvgXBu0Xu28RNYVtBufo6yXa5IoQyk2mlVhb4X5ihjzQJZfSrDZYvBcJ9v0N26goj9cIaEEpBlZ-6UzTDTeJsNowq32F6ViCum1ybzIQl6TXlVsghQLKiZen8kRqb7rjUjg6WWJuPKCn95xDeD3xqkVMLLWihGNzbcOM",
    ],
  },
  "prop-3": {
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCwGbVJwD7r7cwADWlamoJmXtOj6wOUaAqx8sV7mr78BxbNnmzUeIvpfAM2u9n86QY06YvnGXS6BhLBsOhJ7VsU4J55rwRcFxoCSgGY-DPAQsTMcH4KS23Io8_Ez5hbwmwxPoCO2FEp1foA_WDXPbkSPjEH8wa1x3MVvV-speeKt9EVnxVlAtGr97y9LoHrNhK4RQtOsoRGSEvWZ19CPFIrDBgI2hyGF8pi5LW99mcRiUUR5fmqas869ekucMsemuVF93A41ILzUC4",
    gallery: FALLBACK_GALLERY,
  },
  "prop-4": {
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYHAzxdJKFDU8eUQ-Squ5dfCP4xMkPF9hvCKDElGexI9hf-E1y2-qmafGjUlmlzplHf49JtH4r_1y8WJBHOp3OPw2Lk-Gxy77jpWlBn3lilhYA0IamjfG56BZ8BGwiWfUiVv9K7oV3YKeaLNoNJ6vMyuXPHFWCBw772vR0FPuUdv7tNd8R9Z1ldzHOQLSQxWSb8tsK1zE0iE7hl-mhdlPqEk57SwGOGzDaY6VrafCx5lxdNyVs9twAg58wyw2essa9ytlMScMSHh4",
    gallery: FALLBACK_GALLERY,
  },
  "prop-5": {
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC6GzwzrA43GhSTTxW9L1R9OT_qMV2zSe9IYJ2zaGiqrVnI5TgVUTEI4Oh8KblK8UdygbvHKiD1YtEDIOrmTXB0iCUyPYKVefVSniuxELgx0SfliSK6h8hAIoZthYdwjpwdX5tzhuhod_elaVPcyDqw9Nfmmm8OESB72FLGjXdjxsVbAmk-l4qsdXWX_6Dbqu8sTroR6-vRl71U0EGReE351IvFTfreu6pG_tyDMZk3-h5QkqEp_kTLGvt-Ng08pnXYMFXeF4a2vfQ",
    gallery: FALLBACK_GALLERY,
  },
  "prop-6": {
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKJs7hSFf9a4k1bYWk_oh0aytRRGCDNc981zh24UtAQ7uAg-zgIhx_0d3nlXkw9WY7PPeuvnlRTPnt3Hc7FbTnsXMM6sOwrdsYMZwLGIuyZFjcwXq9aLKdE0YjjiikzKPcOItEG-4GbkEQWgasB2UPhBTlSF8LJjhI3ZAPyZv6FJk6ddpgiw8pw8jRNLeyz5PmBwCvP07n_gQ_pyrK1q5cxIMC3NIOIs8P8Tuv-_3qsGZkoHS9I59dmZ5zt7lOtQo9tkRJIzhd1m8",
    gallery: FALLBACK_GALLERY,
  },
};

export function getPropertyCoverImage(propertyId: string): string {
  return VISUALS_BY_ID[propertyId]?.cover ?? FALLBACK_COVER;
}

export function getPropertyGallery(propertyId: string): string[] {
  const gallery = VISUALS_BY_ID[propertyId]?.gallery ?? FALLBACK_GALLERY;
  return gallery.length > 0 ? gallery : FALLBACK_GALLERY;
}
