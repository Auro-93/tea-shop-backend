import { Review } from "../models/Review.js";
import validator from "validator";
import cryptoRandomString from "crypto-random-string";

export const getProductReviews = async (req, res) => {
  const productId = req.query.product;
  const limit = req.query.limit ? req.query.limit : 1;
  const rating = req.query.rating ? req.query.rating : "All";
  const sort = req.query.sort ? req.query.sort : -1;

  try {
    let reviewsArr = [];
    let ratingArr = [];
    const reducer = (previousValue, currentValue) =>
      previousValue + currentValue;

    const reviews = await Review.find().sort({ createdAt: -1 });

    if (reviews) {
      await Promise.all(
        reviews.map((review) => {
          const filteredReviews = review.reviews.filter(
            (el) => el.productId.toString() == productId
          );
          reviewsArr.push(...filteredReviews);
        })
      );
      reviewsArr.forEach((review) => {
        ratingArr.push(review.rating);
      });

      //MANAGE RATING FILTER, LIMIT E SORT

      let filteredByRating = reviewsArr.slice();
      let reviewsFilteredByRatingFunc = (vote) => {
        let filter = reviewsArr.filter((el) => el.rating === vote);
        filteredByRating = filter;
      };
      let reviewsFilteredByRatingSwitch = () => {
        switch (rating) {
          case "Very dissatisfied : 1":
            reviewsFilteredByRatingFunc(1);
            break;
          case "Dissatisfied : 2":
            reviewsFilteredByRatingFunc(2);
            break;
          case "Quite satisfied : 3":
            reviewsFilteredByRatingFunc(3);
            break;
          case "Satisfied : 4":
            reviewsFilteredByRatingFunc(4);
            break;
          case "Very satisfied : 5":
            reviewsFilteredByRatingFunc(5);
            break;
          case "All":
            return;
            break;
        }
      };
      reviewsFilteredByRatingSwitch();

      let sortingByDateArr = [];

      if (sort == -1) {
        sortingByDateArr = filteredByRating.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      } else if (sort == 1) {
        sortingByDateArr = filteredByRating.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      }

      let reviewsLimited = sortingByDateArr.slice(0, limit - 1);

      return res.status(200).json({
        reviews: reviewsLimited,
        count: reviewsArr.length,
        limitedCount: filteredByRating.length,
        averageRating: (
          ratingArr.reduce(reducer, 0) / reviewsArr.length
        ).toFixed(1),
        totalReviews: reviewsArr,
      });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};

export const getUserReview = async (req, res) => {
  const limit = req.query.limit ? req.query.limit : 1;
  const rating = req.query.rating;
  const sort = req.query.sort ? req.query.sort : -1;

  try {
    let reviewsArr;

    let reviews = await Review.findOne({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    if (reviews) {
      if (rating) {
        let reviewsFilteredByRatingFunc = (vote) => {
          reviewsArr = reviews.reviews.filter((el) => el.rating === vote);
        };
        let reviewsFilteredByRatingSwitch = () => {
          switch (rating) {
            case "Very dissatisfied : 1":
              reviewsFilteredByRatingFunc(1);
              break;
            case "Dissatisfied : 2":
              reviewsFilteredByRatingFunc(2);
              break;
            case "Quite satisfied : 3":
              reviewsFilteredByRatingFunc(3);
              break;
            case "Satisfied : 4":
              reviewsFilteredByRatingFunc(4);
              break;
            case "Very satisfied : 5":
              reviewsFilteredByRatingFunc(5);
              break;
            case "All":
              return;
              break;
          }
        };
        reviewsFilteredByRatingSwitch();
      } else {
        reviewsArr = reviews.reviews;
      }

      let sortingByDateArr = [];

      if (sort == -1) {
        sortingByDateArr = reviewsArr.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      } else if (sort == 1) {
        sortingByDateArr = reviewsArr.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      }

      let reviewsLimited = sortingByDateArr.slice(0, limit - 1);

      return res.status(200).json({
        reviewsPerPage: reviewsLimited,
        count: reviews.reviews.length,
        limitedCount: reviewsArr.length,
        totalReviews: reviews.reviews,
      });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};

export const addReview = async (req, res) => {
  const {
    productId,
    productName,
    productSlug,
    username,
    rating,
    title,
    content,
  } = req.body;

  try {
    if (
      !productId ||
      !productName ||
      !productSlug ||
      !username ||
      rating === 0 ||
      !title ||
      !content
    ) {
      return res
        .status(400)
        .json({ errorMessage: "Object properties are all required" });
    }
    if (!validator.isLength(content, { max: 20000 })) {
      return res
        .status(400)
        .json({ errorMessage: "Content can't be more than 20000 characters" });
    }
    if (!validator.isLength(title, { max: 100 })) {
      return res
        .status(400)
        .json({ errorMessage: "Title can't be more than 100 characters" });
    }

    const alreadyReviewed = await Review.findOne({
      userId: req.user._id,
      "reviews.productSlug": { $in: productSlug },
    });
    if (alreadyReviewed) {
      res
        .status(409)
        .json({ errorMessage: "You have already reviewed this product" });
    } else {
      const userReviewsExists = await Review.findOne({ userId: req.user._id });
      if (userReviewsExists) {
        userReviewsExists.reviews?.push({
          reviewId: cryptoRandomString({ length: 9 }),
          reviewUsername: username,
          productId,
          productName,
          productSlug,
          rating,
          title,
          content,
        });
        userReviewsExists
          .save()
          .then((response) => {
            return res.status(200).json({
              successMessage: "Review successfully added, thank you!",
            });
          })
          .catch((error) => {
            return res.status(400).json({ errorMessage: `${error}` });
          });
      } else {
        const review = new Review({
          userId: req.user._id,
          reviews: {
            reviewId: cryptoRandomString({ length: 9 }),
            reviewUsername: username,
            productId,
            productName,
            productSlug,
            rating,
            title,
            content,
          },
        });
        review
          .save()
          .then((response) => {
            return res.status(200).json({
              successMessage: "Review successfully added, thank you!",
            });
          })
          .catch((error) => {
            return res.status(400).json({ errorMessage: `${error}` });
          });
      }
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};

export const removeReview = async (req, res) => {
  const { reviewId } = req.body;

  try {
    const reviews = await Review.findOne({ userId: req.user._id });

    if (reviews) {
      const alreadyReviewed = await reviews.reviews.find(
        (review) => review.reviewId == reviewId
      );
      if (alreadyReviewed) {
        const newReviewsList = reviews.reviews.filter(
          (review) => review.reviewId !== reviewId
        );
        if (newReviewsList.length === 0) {
          Review.deleteOne(
            {
              userId: req.user._id,
            },
            function (err, result) {
              if (err) {
                console.log(err);
              } else {
                return res
                  .status(200)
                  .json({ successMessage: "Review successfully deleted!" });
              }
            }
          );
        } else {
          reviews.reviews = newReviewsList;
          reviews
            .save()
            .then((response) => {
              return res
                .status(200)
                .json({ successMessage: "Review successfully deleted!" });
            })
            .catch((err) => console.log(err));
        }
      } else {
        console.log("Can't find this review");
      }
    } else {
      console.log("No reviews to delete");
    }
  } catch (error) {
    return res.status(400).json({ errorMessage: `${error}` });
  }
};
