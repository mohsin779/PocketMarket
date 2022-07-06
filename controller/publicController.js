const { Category } = require("../models/category");
const { Product } = require("../models/product");
const { Rating } = require("../models/rating");
const { Shop } = require("../models/shop");
const { Language } = require("../models/language");

exports.getCategories = async (req, res, next) => {
  try {
    const { ln } = req.params;
    const categories = await Category.find();

    const catgr = categories.map((category) => {
      let ctegoryName = category.name.get(ln);
      if (ctegoryName == "") {
        ctegoryName = category.name.get("en");
      }
      return {
        ...category._doc,
        name: ctegoryName,
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

    const prods = await Promise.all(
      products.map(async (product) => {
        const rating = await getRatings(product._id);

        let productName = product.name.get(ln);
        let productDescription = product.description.get(ln);
        let productFeatures = product.features.get(ln);

        if (productName == "") {
          productName = product.name.get("en");
        }
        if (productDescription == "") {
          productDescription = product.description.get("en");
        }
        if (productFeatures == "") {
          productFeatures = product.features.get("en");
        }

        return {
          ...product._doc,
          name: productName,
          description: productFeatures,
          features: productFeatures,
          rating,
        };
      })
    );

    res.status(200).send({
      category: category.name.get(ln),
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
    const prods = productData.map((product) => {
      let productName = product.name.get(ln);
      let productDescription = product.description.get(ln);
      let productFeatures = product.features.get(ln);

      if (productName == "") {
        productName = product.name.get("en");
      }
      if (productDescription == "") {
        productDescription = product.description.get("en");
      }
      if (productFeatures == "") {
        productFeatures = product.features.get("en");
      }
      return {
        ...product._doc,
        name: productName,
        description: productFeatures,
        features: productFeatures,
      };
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
  try {
    const { ln, productId } = req.params;

    const product = await Product.findById(productId)
      .select("-retailPrice")
      .populate("creator", "name email");
    if (!product) {
      return res.status(404).send({ error: "Could not find Product." });
    }

    let productName = product.name.get(ln);
    let productDescription = product.description.get(ln);
    let productFeatures = product.features.get(ln);

    if (productName == "") {
      productName = product.name.get("en");
    }
    if (productDescription == "") {
      productDescription = product.description.get("en");
    }
    if (productFeatures == "") {
      productFeatures = product.features.get("en");
    }
    const rating = await getRatings(productId);

    let fetchedProduct = {
      ...product._doc,
      name: productName,
      description: productFeatures,
      features: productFeatures,
      rating,
    };

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

    const name = `name.${ln}`;

    let results = await Product.find(
      {
        [name]: { $regex: ".*" + productName + ".*", $options: "i" },
      },
      { name: 1 }
    );

    const newResults = results.map((item) => {
      return {
        _id: item._id,
        name: item.name.get(ln),
      };
    });

    return res.status(200).send({ products: newResults });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};

const getRatings = async (productId) => {
  const ratings = await Rating.find({
    product: productId,
  });

  const ratingsSum = ratings.reduce(function (total, currentValue) {
    return total + currentValue.rating;
  }, 0);

  const average = ratingsSum / ratings.length;
  return { totalRatings: ratings.length, avg: average };
};

exports.getLanguages = async (req, res, next) => {
  try {
    const languages = await Language.find();
    return res.status(200).send({ languages: languages });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};
