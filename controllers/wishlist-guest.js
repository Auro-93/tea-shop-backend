import { v4 as uuidv4 } from "uuid";
import { WishlistGuest } from "../models/Wishlist.js";

export const updateWishListGuest = async (req, res) => {
  const { favItem, sessionId } = req.body;

  try {
    const wishlist = await WishlistGuest.findOne({ sessionId: sessionId });
    if (wishlist) {
      let checkWishList = wishlist.wishlistItems.find(
        (item) => item._id == favItem._id
      );
      if (checkWishList) {
        let newWishList = wishlist.wishlistItems.filter(
          (item) => item._id != favItem._id
        );

        if (newWishList.length === 0) {
          WishlistGuest.deleteOne({ sessionId: sessionId }, function (err) {
            if (!err) {
              return res.status(200).json({
                prodAddedOrRemoved: favItem.name,
                added: false,
                hidden: false,
                favoriteList: wishlist.wishlistItems,
                count: wishlist.wishlistItems.length,
              });
            }
          });
        } else {
          wishlist.wishlistItems = newWishList;
          wishlist
            .save()
            .then((response) => {
              return res.status(200).json({
                prodAddedOrRemoved: favItem.name,
                added: false,
                hidden: false,
                favoriteList: wishlist.wishlistItems,
                count: wishlist.wishlistItems.length,
              });
            })
            .catch((error) => {
              return res.status(400).json({ errorMessage: `${error}` });
            });
        }
      } else {
        wishlist.wishlistItems.push(favItem);
        wishlist
          .save()
          .then((response) => {
            return res.status(200).json({
              prodAddedOrRemoved: favItem.name,
              added: true,
              hidden: false,
              favoriteList: wishlist.wishlistItems,
              count: wishlist.wishlistItems.length,
            });
          })
          .catch((error) => {
            return res.status(400).json({ errorMessage: `${error}` });
          });
      }
    } else {
      const wishlist = new WishlistGuest({
        sessionId: uuidv4(),
        wishlistItems: favItem,
      });
      wishlist
        .save()
        .then((response) => {
          return res.status(200).json({
            prodAddedOrRemoved: favItem.name,
            added: true,
            hidden: false,
            favoriteList: wishlist.wishlistItems,
            count: wishlist.wishlistItems.length,
            sessionId: wishlist.sessionId,
          });
        })
        .catch((error) => {
          return res.status(400).json({ errorMessage: `${error}` });
        });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};

export const getWishListGuest = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const searchTerm = req.query.name;
    let sort = !req.query.sort ? -1 : req.query.sort;

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * pageSize;
    let totalWishlist = await WishlistGuest.findOne({ sessionId: sessionId });

    if (totalWishlist) {
      const totalWishlistCount = totalWishlist.wishlistItems.length;

      let filter = {
        sessionId: sessionId,
        "wishlistItems.name": { $regex: searchTerm, $options: "i" },
      };

      let resultWithoutSortingAndLimiting = await WishlistGuest.findOne(filter);

      if (
        resultWithoutSortingAndLimiting &&
        resultWithoutSortingAndLimiting.wishlistItems.length !== 0
      ) {
        let finalResult = await WishlistGuest.aggregate([
          {
            $match: { sessionId: sessionId },
          },
          { $unwind: "$wishlistItems" },
          {
            $match: {
              "wishlistItems.name": { $regex: searchTerm, $options: "i" },
            },
          },
          {
            $sort: {
              "wishlistItems.date": sort == -1 ? -1 : 1,
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: pageSize,
          },
          {
            $group: {
              _id: "$_id",
              sessionId: {
                $first: "$sessionId",
              },
              createdAt: {
                $first: "$createdAt",
              },
              updatedAt: {
                $first: "$updatedAt",
              },
              wishlistItems: {
                $push: "$wishlistItems",
              },
            },
          },
        ]);
        const pages = Math.ceil(
          resultWithoutSortingAndLimiting.wishlistItems.length / pageSize
        );

        if (finalResult[0].wishlistItems.length !== 0) {
          return res.status(200).json({
            wishlistItems: finalResult[0].wishlistItems,
            count: totalWishlistCount,
            totalWishlistItems: totalWishlist.wishlistItems,
            page,
            pages,
          });
        } else {
          return res.status(404).json({ errorMessage: "No product found" });
        }
      } else {
        return res.status(404).json({ errorMessage: "No product found" });
      }
    } else {
      return res
        .status(200)
        .json({ wishlistItems: [], count: 0, page: 1, pages: 1 });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};
