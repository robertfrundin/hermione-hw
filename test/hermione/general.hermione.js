const { BASE_URL } = require('../../consts')

const { ROUTES, LINKS, RESOLUTIONS, SCREEN_HEIGHT, SCREEN_WIDTH, DEFAULT_ASSERT_VIEW_CONFIG, CART_ICONS_SELECTORS } = require('./consts')
const { assert } = require('chai')

describe('Общие требования: ', async function () {
  it(' вёрстка должна адаптироваться под ширину экрана', async function () {
    for ({ route, assetViewConfig } of ROUTES) {
      await this.browser.url(route)
      await this.browser.setWindowSize(SCREEN_WIDTH, SCREEN_HEIGHT)
      await this.browser.assertView(`plain-${route}`, '.Application', assetViewConfig || DEFAULT_ASSERT_VIEW_CONFIG)

      for (resolution of RESOLUTIONS) {
        await this.browser.setWindowSize(resolution, SCREEN_HEIGHT)
        await this.browser.assertView(`width=${resolution}px-${route}`, '.Application', assetViewConfig || DEFAULT_ASSERT_VIEW_CONFIG)
      }
    }
  })

  it('ссылки в шапке работают по клику', async function () {
    await this.browser.url('#')

    for ({ text, to, selector } of LINKS) {
      await this.browser.$('.navbar').$(`a*=${text}`).click()
      const currentUrl = await this.browser.getUrl()
      assert.strictEqual(currentUrl, BASE_URL + to)
      const isElementOnTargetPageDisplayed = await this.browser.$(selector).isDisplayed()
      assert.strictEqual(isElementOnTargetPageDisplayed, true)
    }
  })

  it('на ширине меньше 576px навигационное меню должно скрываться за бургер', async function () {
    await this.browser.url('#')
    const navbar = await this.browser.$('.navbar-nav')
    const navbarToggler = await this.browser.$('.navbar-toggler')
    let isNavbarDisplaing = await navbar.isDisplayedInViewport()
    let isNavbarTogglerDisplaing = await navbarToggler.isDisplayedInViewport()
    assert.strictEqual(isNavbarDisplaing, true)
    assert.strictEqual(isNavbarTogglerDisplaing, false)
    await this.browser.setWindowSize(575, SCREEN_HEIGHT)
    isNavbarDisplaing = await navbar.isDisplayedInViewport()
    isNavbarTogglerDisplaing = await navbarToggler.isDisplayedInViewport()

    assert.strictEqual(isNavbarDisplaing, false)
    assert.strictEqual(isNavbarTogglerDisplaing, true)
  })

  it('по нажатию на бургер, меню должно закрываться', async function () {
    await this.browser.url('#')

    await this.browser.setWindowSize(575, SCREEN_HEIGHT)
    const navbar = await this.browser.$('.navbar-nav')
    const navbarToggler = await this.browser.$('.navbar-toggler')
    const filteredNavbarLinks = LINKS.filter(({ text }) => text !== 'Example store')

    for ({ text } of filteredNavbarLinks) {
      await navbarToggler.click()
      let isNavbarDisplaing = await navbar.isDisplayedInViewport()
      assert.strictEqual(isNavbarDisplaing, true)
      await this.browser.$('.navbar-nav').$(`a*=${text}`).click()
      isNavbarDisplaing = await navbar.isDisplayedInViewport()
      assert.strictEqual(isNavbarDisplaing, false)
    }
  })
})

describe('Страницы: ', async function () {
  it('в магазине должны быть страницы: главная, каталог, условия доставки, контакты', async function () {
    for ({ text, to, selector } of LINKS) {
      await this.browser.url(to === '' ? '#' : to)
      const isElementOnTargetPageDisplayed = await this.browser.$(selector).isDisplayed()
      assert.strictEqual(isElementOnTargetPageDisplayed, true)
    }
  })

  it('страницы главная, условия доставки, контакты должны иметь статическое содержимое', async function () {
    const STATIC_ROUTES = [{ route: '#' }, { route: 'delivery' }, { route: 'contacts' }]

    const checkStaticRoutes = async (mark) => {
      for ({ route } of STATIC_ROUTES) {
        await this.browser.url(route)
        await this.browser.assertView(`plain-static-${route}${mark}`, '.Application', {
          compositeImage: false,
          allowViewportOverflow: true,
          ignoreElements: ['.navbar'],
        })
      }
    }

    const addProductZeroToCart = async () => {
      await this.browser.url('catalog/0')
      await this.browser.$('.ProductDetails-AddToCart').click()
    }

    await checkStaticRoutes('')
    await addProductZeroToCart()

    await checkStaticRoutes('-added-product')

    await this.browser.url('cart')
    await this.browser.$('.Cart-Clear').click()

    await checkStaticRoutes('-cart-clear')
    await addProductZeroToCart()

    await this.browser.url('cart')
    await this.browser.$('.Form-Field_type_name').addValue('Test')
    await this.browser.$('.Form-Field_type_phone').addValue('999999999999')
    await this.browser.$('.Form-Field_type_address').addValue('Test')
    await this.browser.$('.Form-Submit').keys(['Enter'])

    await checkStaticRoutes('-submitted-form')
  })
})

describe('Каталог: ', async function () {
  it('для каждого товара в каталоге отображается название, цена и ссылка на страницу с подробной информацией', async function () {
    await this.browser.url('catalog')

    const productItems = await this.browser.$$('.ProductItem')

    for (productItem of productItems) {
      const isProductNameDisplayed = await productItem.$('.ProductItem-Name').isDisplayed()
      const isProductPriceDisplayed = await productItem.$('.ProductItem-Price').isDisplayed()
      const isProductDetailsLinkDisplayed = await productItem.$('.ProductItem-DetailsLink').isDisplayed()

      const isCardElementsDisplayed = isProductNameDisplayed && isProductPriceDisplayed && isProductDetailsLinkDisplayed

      assert.strictEqual(isCardElementsDisplayed, true)
    }
  })

  it('для каждого товара в каталоге ссылка на страницу с подробной информацией о товаре рабочая', async function () {
    await this.browser.url('catalog')

    const productItems = (await this.browser.$$('.ProductItem')).slice(0, 3)

    for (productItem of productItems) {
      const productName = await productItem.$('.ProductItem-Name').getText()

      const productDetailsLink = await productItem.$('.ProductItem-DetailsLink')
      await productDetailsLink.click()

      const currentUrl = await this.browser.getUrl()
      const isUrlCorrect = /.*\/catalog\/\d+$/i.test(currentUrl)

      assert.strictEqual(isUrlCorrect, true)

      const productNameDisplayed = await this.browser.$('.ProductDetails-Name').getText()

      assert.strictEqual(productNameDisplayed, productName)

      await this.browser.url('catalog')
    }
  })

  it('на странице с подробной информацией отображаются: название товара, его описание, цена, цвет, материал и кнопка "добавить в корзину"', async function () {
    await this.browser.url('catalog')

    const productItemsLength = (await this.browser.$$('.ProductItem')).length

    for (let i = 0; i < productItemsLength; i++) {
      await this.browser.url(`catalog/${i}`)

      const isProductNameDisplayed = await this.browser.$('.ProductDetails-Name').isDisplayed()
      const isProductDescriptionDisplayed = await this.browser.$('.ProductDetails-Description').isDisplayed()
      const isProductPriceDisplayed = await this.browser.$('.ProductDetails-Price').isDisplayed()
      const isProductColorDisplayed = await this.browser.$('.ProductDetails-Color').isDisplayed()
      const isProductMaterialDisplayed = await this.browser.$('.ProductDetails-Material').isDisplayed()
      const isAddToCartButtonDisplayed = await this.browser.$('.ProductDetails-AddToCart').isDisplayed()

      const isCardElementsDisplayed = isProductNameDisplayed && isProductDescriptionDisplayed && isProductPriceDisplayed && isProductColorDisplayed && isProductMaterialDisplayed && isAddToCartButtonDisplayed

      assert.strictEqual(isCardElementsDisplayed, true)
    }

    await this.browser.url('cart')
    await this.browser.$('.Cart-Clear').click()
  })

  it('если товар уже добавлен в корзину, в каталоге и на странице товара должно отображаться сообщение об этом', async function () {
    await this.browser.url('catalog')

    let productItemCard = await this.browser.$('.ProductItem')
    let isCardCartBadgeDisplaying = await productItemCard.$('.CartBadge').isDisplayed()

    assert.strictEqual(isCardCartBadgeDisplaying, false)

    await productItemCard.$('.ProductItem-DetailsLink').click()

    const productItemCartBadge = await this.browser.$('.CartBadge')
    let isCartBadgeDisplaying = await productItemCartBadge.isDisplayed()

    assert.strictEqual(isCardCartBadgeDisplaying, false)

    await this.browser.$('.ProductDetails-AddToCart').click()

    isCartBadgeDisplaying = await productItemCartBadge.isDisplayed()

    assert.strictEqual(isCartBadgeDisplaying, true)

    await this.browser.url('catalog')

    productItemCard = await this.browser.$('.ProductItem')

    isCardCartBadgeDisplaying = await productItemCard.$('.CartBadge').isDisplayed()

    assert.strictEqual(isCardCartBadgeDisplaying, true)

    await this.browser.url('cart')
    await this.browser.$('.Cart-Clear').click()
  })

  it('если товар уже добавлен в корзину, повторное нажатие кнопки "добавить в корзину" должно увеличивать его количество', async function () {
    const goToFirstProductDetailPageAndAddIt = async () => {
      await this.browser.url('catalog/0')
      await this.browser.$('.ProductDetails-AddToCart').click()
    }

    const getProductCount = async () => {
      await this.browser.url('cart')

      const productCount = await this.browser.$('.Cart-Count').getText()

      return productCount
    }

    await goToFirstProductDetailPageAndAddIt()

    let productCount = await getProductCount()

    assert.strictEqual(productCount, '1')

    await goToFirstProductDetailPageAndAddIt()

    productCount = await getProductCount()

    assert.strictEqual(productCount, '2')

    await this.browser.url('cart')
    await this.browser.$('.Cart-Clear').click()
  })

  it('cодержимое корзины должно сохраняться между перезагрузками страницы', async function () {
    const getTableContent = async () => {
      const tableContent = {}

      for (selector of CART_ICONS_SELECTORS) {
        const columns = await this.browser.$$(selector)
        tableContent[selector] = []

        for (cell of columns) {
          const cellContent = await cell.getText()
          tableContent[selector].push(cellContent)
        }
      }

      return tableContent
    }

    await this.browser.url('catalog/0')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.url('catalog/1')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.url('cart')

    const tableContent = await getTableContent()

    await this.browser.refresh()

    const refreshedTableContent = await getTableContent()

    assert.deepEqual(tableContent, refreshedTableContent)

    await this.browser.url('cart')
    await this.browser.$('.Cart-Clear').click()
  })
})

describe('Корзина: ', async function () {
  it('в шапке рядом со ссылкой на корзину должно отображаться количество не повторяющихся товаров в ней', async function () {
    await this.browser.url('catalog/0')

    const link = await this.browser.$('.navbar').$(`a*=Cart`)
    let text = await link.getText()

    assert.strictEqual(text, 'Cart')

    await this.browser.$('.ProductDetails-AddToCart').click()

    text = await link.getText()

    assert.strictEqual(text, 'Cart (1)')

    await this.browser.url('catalog/1')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.$('.ProductDetails-AddToCart').click()

    text = await link.getText()

    assert.strictEqual(text, 'Cart (2)')

    await this.browser.url('cart')
    await this.browser.$('.Cart-Clear').click()

    text = await link.getText()

    assert.strictEqual(text, 'Cart')
  })

  it('в корзине должна отображаться таблица с добавленными в нее товарами', async function () {
    await this.browser.url('cart')

    let isTableDisplayed = await this.browser.$('.Cart-Table').isDisplayed()

    assert.strictEqual(isTableDisplayed, false)

    await this.browser.url('catalog/0')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.url('catalog/1')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.url('cart')

    isTableDisplayed = await this.browser.$('.Cart-Table').isDisplayed()

    assert.strictEqual(isTableDisplayed, true)

    await this.browser.$('.Cart-Clear').click()
  })

  it('для каждого товара должны отображаться название, цена, количество , стоимость, а также должна отображаться общая сумма заказа', async function () {
    await this.browser.url('catalog/0')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.url('catalog/1')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.url('cart')

    const rows = await this.browser.$$('tbody tr')

    assert.strictEqual(Array.isArray(rows) && rows.length === 2, true)

    let orderSum = 0

    for (row of rows) {
      for (selector of CART_ICONS_SELECTORS) {
        const cartCell = await row.$(selector)
        const isCartCellDisplayed = await cartCell.isDisplayed()
        assert.strictEqual(isCartCellDisplayed, true)

        if (selector === '.Cart-Total') {
          const total = +(await cartCell.getText()).slice(1)
          orderSum += total
        }
      }
    }

    const orderPrice = await this.browser.$('.Cart-OrderPrice')
    const orderPriceText = await orderPrice.getText()
    const isOrderPriceDisplaying = await orderPrice.isDisplayed()

    assert.strictEqual(isOrderPriceDisplaying, true)
    assert.strictEqual(orderPriceText, `$${orderSum}`)

    await this.browser.$('.Cart-Clear').click()
  })

  it('в корзине должна быть кнопка "очистить корзину" по нажатию на которую все товары должны удаляться;', async function () {
    await this.browser.url('cart')

    const cartClearButton = await this.browser.$('.Cart-Clear')
    let isTableDisplayed = await this.browser.$('.Cart-Table').isDisplayed()
    let isCartClearButtonDisplayed = await cartClearButton.isDisplayed()

    assert.strictEqual(isCartClearButtonDisplayed, false)
    assert.strictEqual(isTableDisplayed, false)

    await this.browser.url('catalog/0')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.url('catalog/1')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.url('cart')

    isTableDisplayed = await this.browser.$('.Cart-Table').isDisplayed()
    isCartClearButtonDisplayed = await cartClearButton.isDisplayed()

    assert.strictEqual(isCartClearButtonDisplayed, true)
    assert.strictEqual(isTableDisplayed, true)

    await this.browser.$('.Cart-Clear').click()

    isTableDisplayed = await this.browser.$('.Cart-Table').isDisplayed()
    isCartClearButtonDisplayed = await cartClearButton.isDisplayed()

    assert.strictEqual(isCartClearButtonDisplayed, false)
    assert.strictEqual(isTableDisplayed, false)
  })

  it('если корзина пустая, должна отображаться ссылка на каталог товаров', async function () {
    await this.browser.url('cart')

    const linkToCatalog = await this.browser.$('.Cart a')
    let isLinkToCatalogDisplaying = await linkToCatalog.isDisplayed()

    assert.strictEqual(isLinkToCatalogDisplaying, true)

    await this.browser.url('catalog/0')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.url('catalog/1')
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.$('.ProductDetails-AddToCart').click()
    await this.browser.url('cart')

    isLinkToCatalogDisplaying = await linkToCatalog.isDisplayed()

    assert.strictEqual(isLinkToCatalogDisplaying, false)

    await this.browser.$('.Cart-Clear').click()

    isLinkToCatalogDisplaying = await linkToCatalog.isDisplayed()

    assert.strictEqual(isLinkToCatalogDisplaying, true)
  })
})
