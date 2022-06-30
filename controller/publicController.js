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
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.limit) || 10;

    const category = await Category.findById(categoryId);
    let totalItems = await Product.find({
      category: categoryId,
    }).countDocuments();

    const products = await Product.find({ category: categoryId })
      .select("-retailPrice")
      .populate("category")
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    const prods = products.map((p) => {
      return productsInSelectedLanguage(ln, p);
    });

    res.status(200).send({
      category: category.name[ln],
      products: prods,
      totalpages: Math.ceil(totalItems / perPage),
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

exports.changeNames = async (req, res, next) => {
  try {
    const { ln } = req.params;
    const { products } = req.body;
    const productData = await Promise.all(
      products.map(async (prod) => {
        return await Product.findById({ _id: prod._id }).select(
          "-quantity -retailPrice"
        );
      })
    );
    const prods = productData.map((p) => {
      return productsInSelectedLanguage(ln, p);
    });

    return res.status(200).send({ products: prods });
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
    res.status(500).send({ error: err });
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
    res.status(500).send({ error: err });
  }
};

exports.search = async (req, res, next) => {
  try {
    const { ln } = req.params;
    const { productName } = req.body;
    let results;
    if (ln === "en") {
      results = await Product.find(
        {
          "name.nameEn": { $regex: ".*" + productName + ".*", $options: "i" },
        },
        { name: 1 }
      );
    } else if (ln === "fr") {
      results = await Product.find(
        {
          "name.nameFr": { $regex: ".*" + productName + ".*", $options: "i" },
        },
        { name: 1 }
      );
    } else {
      return res.status(400).send({ error: "invalid language!" });
    }

    const newResults = results.map((item) => {
      if (ln === "en") {
        return {
          _id: item._id,
          name: item.name.get("nameEn"),
        };
      } else if (ln === "fr") {
        return {
          _id: item._id,
          name: item.name.get("nameFr"),
        };
      } else {
        return res.status(400).send({ error: "invalid language!" });
      }
    });

    return res.status(200).send({ products: newResults });
  } catch (err) {
    res.status(500).send({ error: err });
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
