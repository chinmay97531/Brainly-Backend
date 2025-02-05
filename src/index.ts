import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { z } from "zod";
import bcrypt from "bcrypt";
import cors from "cors";

import { ContentModel, LinkModel, UserModel } from "./db";

const app = express();
import { JWT_SECRET } from "./config";
import { userMiddleware } from "./middleware";
import { random } from "./utils";

app.use(express.json());
app.use(cors());

app.post("/api/v1/signup", async (req, res) => {
  const requiredBody = z.object({
    username: z.string().min(2).max(50),
    password: z.string().min(3).max(50),
    email: z.string().min(3).max(100).email(),
  });
  const parsedDatawithSuccess = requiredBody.safeParse(req.body);

  if (!parsedDatawithSuccess.success) {
    console.log("Validation Errors:", parsedDatawithSuccess.error.errors);
    res.status(400).json({
      message: "Invalid Data",
      errors: parsedDatawithSuccess.error.errors,
    });
    return;
  }

  const { username, password, email } = parsedDatawithSuccess.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 5);

    await UserModel.create({
      username: username,
      email: email,
      password: hashedPassword,
    });
  } catch (err) {
    res.status(400).json({
      message: "User already exists",
    });
    return;
  }

  res.json({
    message: "User Created",
  });
});

app.post("/api/v1/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await UserModel.findOne({
    username: username,
  });

  if (!user) {
    res.status(403).json({
      message: "User not found",
    });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (passwordMatch) {
    const token = jwt.sign(
      {
        id: user._id.toString(),
      },
      JWT_SECRET
    );
    res.json({
      token: token,
    });
  } else {
    res.status(403).json({
      message: "Incorrect Credentials",
    });
  }
});

//@ts-ignore
app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const link = req.body.link;
  const title = req.body.title;
  const type = req.body.type;

  try {
    await ContentModel.create({
      link,
      title,
      type,
      //@ts-ignore
      userId: req.userId,
      tags: [],
    });

    res.json({
      message: "Content added",
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding content", error: (error as any).message });
  }
});

//@ts-ignore
app.get("/api/v1/content", userMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    const content = await ContentModel.find({
        userId: userId
    }).populate("userId", "username email")
    res.json({
        content
    })
});

//@ts-ignore
app.delete("/api/v1/content", userMiddleware, async (req, res) => {
    const {contentId} = req.body;
    //@ts-ignore
    const objectId = new mongoose.Types.ObjectId(contentId);

    const result = await ContentModel.deleteOne({
        _id: objectId,
        // @ts-ignore
        userId: req.userId
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No matching content found to delete" });
  }

    res.json({
        message: "Delete content successfully"
    })
});

//@ts-ignore
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  const share = req.body.share;

  if(share) {
    const existingLink = await LinkModel.findOne({
      //@ts-ignore
      userId: req.userId
    })

    if(existingLink) {
      res.json({
        hash: existingLink.hash
      })
      return;
    }

    const hash = random(10);
    await LinkModel.create({
      //@ts-ignore
          userId: req.userId,
          hash: hash
    })

    res.json({
      message: "/share/" +  hash
    })
  }
  else {
    await LinkModel.deleteOne({
      //@ts-ignore
      userId: req.userId
    });

    res.json({
      message: "Updated sharable link"
    })
  }
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
  const hash = req.params.shareLink;

  const link = await LinkModel.findOne({
    hash
  });

  if(!link) {
    res.status(411).json({
      message: "Sorry Incoorect Input"
    })
    return;
  } 

  const content = await ContentModel.find({
    userId: link.userId
  })

  const user = await UserModel.findOne({
    _id: link.userId.toString()
  })

  if(!user) {
    res.status(411).json({
      message: "User not found, error should ideally not happen!"
    })
    return;
  }

  res.json({
    username: user.username,
    content: content
  })
});

app.listen(3000, () => {
  console.log("Server is listening on PORT 3000");
});
