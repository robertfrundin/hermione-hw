const ROUTES = [
  { route: '#' },
  {
    route: 'catalog',
    assetViewConfig: {
      compositeImage: false,
      allowViewportOverflow: true,
      ignoreElements: ["[data-testid='0'] h5", "[data-testid='1'] h5", "[data-testid='2'] h5", "[data-testid='3'] h5", "[data-testid='0'] p", "[data-testid='1'] p", "[data-testid='2'] p", "[data-testid='3'] p"],
    },
  },
  { route: 'delivery' },
  { route: 'contacts' },
  { route: 'cart' },
]

const RESOLUTIONS = [700, 375]

const SCREEN_WIDTH = 1200

const SCREEN_HEIGHT = 800

const DEFAULT_ASSERT_VIEW_CONFIG = {
  compositeImage: true,
}

const LINKS = [
  {
    text: 'Catalog',
    to: 'catalog',
    selector: 'h1*=Catalog',
  },
  {
    text: 'Delivery',
    to: 'delivery',
    selector: 'h1*=Delivery',
  },
  {
    text: 'Contacts',
    to: 'contacts',
    selector: 'h1*=Contacts',
  },
  {
    text: 'Cart',
    to: 'cart',
    selector: 'h1*=Shopping cart',
  },
  {
    text: 'Example store',
    to: '',
    selector: 'p*=Welcome to Example store!',
  },
]

const CART_ICONS_SELECTORS = ['.Cart-Index', '.Cart-Name', '.Cart-Price', '.Cart-Count', '.Cart-Total']

module.exports = {
  ROUTES,
  RESOLUTIONS,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  DEFAULT_ASSERT_VIEW_CONFIG,
  LINKS,
  CART_ICONS_SELECTORS,
}
