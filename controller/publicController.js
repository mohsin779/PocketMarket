const { Category } = require("../models/category");
const { Product } = require("../models/product");
const { Shop } = require("../models/shop");

exports.getCategories = async (req, res, next) => {
  try {
    const { ln } = req.params;
    const categories = await Category.find();

    const catgr = categories.map((c) => {
      return {
        ...c._doc,
        name: c.name[ln],
      };
    });

    res.status(200).send({ categories: catgr });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const { ln, categoryId } = req.params;

    const products = await Product.find({ category: categoryId }).populate(
      "category"
    );
    const prods = products.map((p) => {
      return productsInSelectedLanguage(ln, p);
    });
    res.status(200).send({ products: prods });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.getShop = async (req, res, next) => {
  const shopId = req.params.shopId;
  const shop = await Shop.findById(shopId).select("-password -role");
  try {
    if (!shop) {
      return res.status(404).send("Could not find Shop");
    }
    res.status(200).json({ message: "Shop fetched.", shop: shop });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  const { ln, productId } = req.params;

  const product = await Product.findById(productId).select("-retailPrice");
  try {
    if (!product) {
      return res.status(404).send({ error: "Could not find Product." });
    }
    let fetchedProduct = productsInSelectedLanguage(ln, product);

    res
      .status(200)
      .json({ message: "Product fetched.", product: fetchedProduct });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
const productsInSelectedLanguage = (ln, product) => {
  let fetchedProduct;
  if (ln == "en") {
    fetchedProduct = {
      ...product._doc,
      name: product.name.nameEn,
      description: product.description.descriptionEn,
      features: product.features.featuresEn,
    };
    if (fetchedProduct.name == "") {
      fetchedProduct = { ...fetchedProduct, name: product.name.nameFr };
    }
    if (fetchedProduct.description == "") {
      fetchedProduct = {
        ...fetchedProduct,
        description: product.description.descriptionFr,
      };
    }
    if (fetchedProduct.features == "") {
      fetchedProduct = {
        ...fetchedProduct,
        features: product.features.featuresFr,
      };
    }
  } else if (ln == "fr") {
    fetchedProduct = {
      ...product._doc,
      name: product.name.nameFr,
      description: product.description.descriptionFr,
      features: product.features.featuresFr,
    };
    if (fetchedProduct.name == "") {
      fetchedProduct = { ...fetchedProduct, name: product.name.nameEn };
    }
    if (fetchedProduct.description == "") {
      fetchedProduct = {
        ...fetchedProduct,
        description: product.description.descriptionEn,
      };
    }
    if (fetchedProduct.features == "") {
      fetchedProduct = {
        ...fetchedProduct,
        features: product.features.featuresEn,
      };
    }
  }
  return fetchedProduct;
};
