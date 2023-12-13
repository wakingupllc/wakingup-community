const titleStack = [
  'GreekFallback', // Ensures that greek letters render consistently
  'Inter',
  'Helvetica Neue',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

const serifStack = [
  'Merriweather',
  'Baskerville',
  'Libre Baskerville',
  'Georgia',
  'serif'
].join(',')

// TODO why is SanSerifStack different from titleStack?
const sansSerifStack = [
  'GreekFallback', // Ensures that greek letters render consistently
  'Inter',
  'Helvetica Neue',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

export const wakingUpTheme: SiteThemeSpecification = {
  shadePalette: {
    primaryAlpha: (alpha: number) => `rgba(12, 134, 155,${alpha})`,
    fonts: {sansSerifStack, serifStack},
  },
  componentPalette: (shadePalette: ThemeShadePalette) => ({
    // Waking Up just has one highlight color, so primary/secondary/tertiary are pretty similar.
    primary: {
      main: '#215adb',
      light: '#5a85e6',
      dark: '#3e64bb'
    },
    secondary: {
      main: '#215adb',
      light: '#5a85e6',
      dark: '#1842a0'
    },
    lwTertiary: {
      main: "#3e64bb",
      dark: "#3e64bb",
    },
    error: {
      main: "#bf360c",
    },
    warning: {
      main: "#ffad08"
    },
    text: {
      primaryAlert: "#3e64bb"
    },
    link: {
      unmarked: "#0D5EC9",
      visited: "#212121",
    },
    background: {
      default: shadePalette.type === 'light' ? '#e5e5e5' : shadePalette.grey[60],
      primaryDim: '#e2f1f4',
      primaryTranslucent: "rgba(12, 134, 155, 0.05)",
      warningTranslucent: "rgba(255, 173, 8, 0.1)",
    },
    header: {
      text: shadePalette.type === 'light' ? "rgba(0,0,0,.87)" : shadePalette.greyAlpha(.87),
      background: shadePalette.type === 'light' ? '#ffffff' : shadePalette.grey[30],
    },
    event: '#215adb',
    group: '#538747',
    individual: '#BF577D',
    icon: {
      navigationSidebarIcon: shadePalette.greyAlpha(0.5),
      sprout: '#5EB25C'
    },
    border: {
      primaryHighlight: '#88c9d4',
      primaryHighlight2: '#bae2e8',
      secondaryHighlight: '#aedba3',
      secondaryHighlight2: '#d8edd3',
    },
    blockquoteHighlight: {
      commentHovered: shadePalette.type === 'light' ? "#b5e5ed" : "#144952",
      individualQuoteHovered: shadePalette.type === 'light' ? "#b5e5ed" : "#144952",
      addedBlockquoteHighlightStyles: `padding-top: 4px; padding-bottom: 6px;`
    },
    buttons: {
      alwaysPrimary: '#215adb',
    },
    tag: {
      text: shadePalette.grey[1000],
      background: shadePalette.grey[0],
      backgroundHover: shadePalette.greyAlpha(0.03),
      border: shadePalette.greyBorder("1px", .15),
      coreTagText: shadePalette.grey[1000],
      coreTagBackground: shadePalette.grey[250],
      coreTagBackgroundHover: shadePalette.grey[340],
      coreTagBorder: `1px solid ${shadePalette.grey[250]}`,
      hollowTagBorder: shadePalette.greyBorder("1px", .15),
      hollowTagBackground: shadePalette.grey[0],
      hollowTagBackgroundHover: shadePalette.greyAlpha(0.03),
      boxShadow: `1px 2px 5px ${shadePalette.boxShadowColor(.2)}`,
      addTagButtonBackground: shadePalette.grey[300],
    },
  }),
  make: (palette: ThemePalette) => {
    const defaultBorderRadius = 6
    const basicText = {
      color: palette.grey[900],
      // use ems (not rems) to preserve relative height even if font-size is changed
      lineHeight: '20px',
      fontWeight: 400,
      fontFamily: sansSerifStack,
    }
    return {
      baseFontSize: 14,
      spacing: {
        mainLayoutPaddingTop: 20
      },
      borderRadius: {
        default: defaultBorderRadius,
        small: 4,
      },
      typography: {
        fontDownloads: [
          "https://fonts.googleapis.com/css?family=Merriweather:300,400,500,600,700&subset=all",
          "https://fonts.googleapis.com/css?family=Inter:300,400,450,500,600,700",
          // TODO we need to find where this is used in material ui and remove
          "https://fonts.googleapis.com/css?family=Roboto:300,400,500",
        ],
        cloudinaryFont: {
          stack: "'Inter', sans-serif",
          url: "https://fonts.googleapis.com/css?family=Inter",
        },
        fontFamily: sansSerifStack,
        body1: {
          ...basicText,
          fontSize: "1rem",
          lineHeight: '20px',
          fontFamily: serifStack,
        },
        body2: {
          fontSize: "14px",
          lineHeight: "1.5em",
          fontWeight: 450,
        },
        smallText: {
          fontFamily: palette.fonts.sansSerifStack,
          fontWeight: 450,
          fontSize: "1rem",
          lineHeight: '1.4rem'
        },
        tinyText: {
          fontWeight: 450,
          fontSize: ".75rem",
          lineHeight: '1.4rem'
        },
        postStyle: {
          ...basicText,
        },
        headerStyle: {
          fontFamily: titleStack
        },
        commentStyle: {
          fontFamily: sansSerifStack,
          fontWeight: 450
        },
        errorStyle: {
          color: palette.error.main,
          fontFamily: sansSerifStack
        },
        headline: {
          fontFamily: serifStack,
        },
        subheading: {
          fontFamily: titleStack
        },
        title: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 500,
          marginBottom: 5,
        },
        // used by h3
        display0: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 600,
          fontSize: '1.6rem',
          lineHeight: '1.25em',
        },
        // used by h2
        display1: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 650,
          fontSize: '2rem',
          lineHeight: '1.25em',
        },
        // used by h1
        display2: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 600,
          fontSize: '2.4rem',
          lineHeight: '1.25em',
        },
        // used by page title
        display3: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 500,
          lineHeight: '1.25em'
        },
        uiSecondary: {
          sansSerifStack
        },
        chapterTitle: {
          fontSize: "1.25em",
          fontStyle: "unset",
          textTransform: "unset",
          color: palette.grey[800],
          lineHeight: "1.75em",
          fontFamily: serifStack
        },
        largeChapterTitle: {
          fontSize: "2.2rem"
        },
        italic: {
          fontStyle: "normal",
        },
        smallCaps: {
          fontVariant: "normal",
        },
      },
      overrides: {
        Header: {
          title: {
            ["@media screen and (max-width: 380px)"]: {
              paddingRight: 0,
            },
            SiteLogo: {
              root: {
                ["@media screen and (max-width: 380px)"]: {
                  maxWidth: "100%",
                  height: "auto",
                },
              }
            },
          }
        },
        SearchBar: {
          searchInputArea: {
            ["@media screen and (max-width: 380px)"]: {
              minWidth: 40,
            },
          }
        },
        NotificationsMenuButton: {
          badgeContainer: {
            ["@media screen and (max-width: 380px)"]: {
              width: 40,
            },
          }
        },
        SiteLogo: {
          root: {
            height: "24px",
            marginTop: "4px",
            '@media (max-width: 979px)': {
              height: "20px",
            },
          }
        },
        Layout: {
          main: {
            '@media (max-width: 979px)': {
              paddingTop: 22,
            },
          },
          whiteBackground: {
            "& .ToCColumn-content, & .ToCColumn-header": {
              backgroundColor: "#fff",
            },
          }
        },
        MuiTooltip: {
          tooltip: {
            fontSize: "1rem",
            padding: ".7rem",
          }
        },
        MetaInfo: {
          root: {
            fontFamily: sansSerifStack
          }
        },
        PostsVote: {
          voteScore: {
            paddingTop:4,
            paddingBottom:2,
            paddingLeft:1,
            paddingRight:0,
            fontSize: '50%',
            fontFamily: sansSerifStack,
          },
        },
        PostsTopSequencesNav: {
          root: {
            marginBottom: -8,
          },
          title: {
            textTransform: 'uppercase',
            fontSize: 18,
            color: 'rgba(0,0,0,.7)',
            fontWeight: 500,
          }
        },
        FilterMode: {
          selected: {
            color: palette.primary.main
          }
        },
        NavigationStandalone: {
          sidebar: {
            top: 26,
          },
          footerBar: {
            backgroundColor: palette.grey[200],
          }
        },
        TabNavigationItem: {
          navButton: {
            paddingTop: 10,
            paddingBottom: 10,
          },
          icon: {
            opacity: 1,
          },
        },
        TabNavigationFooterItem: {
          selected: {
            backgroundColor: palette.secondary.main
          }
        },
        TabNavigationCompressedItem: {
          icon: {
            opacity: 1
          }
        },
        ContentStyles: {
          postHighlight: {
            fontFamily: palette.fonts.sansSerifStack,
            fontWeight: 400,
            fontSize: "1rem",
            lineHeight: '20px',
            "& li": {
              fontFamily: palette.fonts.sansSerifStack,
            }
          }
        },
        PostsPageTitle: {
          root: {
            lineHeight: 1.25,
            fontWeight: 700,
            fontSize: 24,
            ["@media screen and (max-width: 960px)"]: {
              fontSize: 24,
            },
          }
        },
        EditTitle: {
          root: {
            fontSize: 24,
          },
        },
        PostsTimeBlock: {
          divider: {
            display: 'none'
          }
        },
        FormGroup: {
          formSectionHeadingTitle: {
            fontSize: 16,
          }
        },
        EAAllTagsPage: {
          portal: {
            background: palette.grey[0],
            marginTop: 'unset',
            marginBottom: 'unset',
            padding: '20px',
            boxShadow: "0 1px 5px rgba(0,0,0,.025)",
          }
        },
        TagSmallPostLink: {
          wrap: {
            lineHeight: '1.2em'
          }
        },
        TagsDetailsItem: {
          description: {
            maxWidth: 490,
          }
        },
        ContentType: {
          root: {
            color: palette.grey[800],
            fontWeight: 600
          },
          icon: {
            color: palette.grey[800]
          }
        },
        MuiSnackbarContent: {
          root: {
            backgroundColor: palette.lwTertiary.main
          }
        },
        MuiMenuItem: {
          root: {
            fontFamily: sansSerifStack,
            fontWeight: 500,
            fontSize: "1.1rem",
            color: palette.grey[900],
          }
        },
        MuiListItemIcon: {
          root: {
            color: palette.grey[700],
            marginRight: 12,
          }
        },
        MuiIconButton: {
          root: {
            borderRadius: defaultBorderRadius
          }
        },
        EAPostsItem: {
          contentPreviewContainer: {
            padding: "15px 50px",
          }
        }
      }
    }
  }
};
