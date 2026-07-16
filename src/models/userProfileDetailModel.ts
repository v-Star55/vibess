import mongoose from "mongoose";

const userProfileDetailSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // Pop Culture
    favoriteMovie: { type: String, default: "" },
    favoriteSeries: { type: String, default: "" },
    lastMovieWatched: { type: String, default: "" },
    favoriteAnime: { type: String, default: "" },
    favoriteSuperhero: { type: String, default: "" },
    favoriteGame: { type: String, default: "" },
    songOnRepeat: { type: String, default: "" },
    favoriteArtistBand: { type: String, default: "" },
    favoriteBook: { type: String, default: "" },
    favoritePodcast: { type: String, default: "" },

    // Personality
    threeWordsDescribeMe: { type: String, default: "" },
    nightOwlEarlyBird: { type: String, default: "" },
    coffeeOrTea: { type: String, default: "" },
    mountainsOrBeach: { type: String, default: "" },
    catOrDog: { type: String, default: "" },
    sweetOrSpicy: { type: String, default: "" },
    introvertExtrovertAmbivert: { type: String, default: "" },
    biggestGreenFlag: { type: String, default: "" },
    biggestRedFlag: { type: String, default: "" },
    myToxicTrait: { type: String, default: "" },

    // Food
    favoriteCuisine: { type: String, default: "" },
    goToMidnightSnack: { type: String, default: "" },
    favoriteFastFood: { type: String, default: "" },

    // Hobbies (Array of strings from selection)
    hobbies: { type: [String], default: [] },

    // Personality Traits (Array of strings from selection)
    personalities: { type: [String], default: [] },

    // Travel
    dreamDestination: { type: String, default: "" },
    mostBeautifulPlaceBeen: { type: String, default: "" },
    nextTrip: { type: String, default: "" },
    windowOrAisle: { type: String, default: "" },

    // Fun Questions
    ifOneCroreToday: { type: String, default: "" },
    zombieApocalypseRole: { type: String, default: "" },
    fictionalCharacter: { type: String, default: "" },
    neverGetTiredOf: { type: String, default: "" },
    lifeTitle: { type: String, default: "" },
    mostEmbarrassingMoment: { type: String, default: "" },
    lastThingLaugh: { type: String, default: "" },
    conspiracyTheoryBelieve: { type: String, default: "" },
    dinnerWithAnyone: { type: String, default: "" },

    // For Developers
    favoriteLanguage: { type: String, default: "" },
    dreamCompany: { type: String, default: "" },
    currentSideProject: { type: String, default: "" },
    vsCodeTheme: { type: String, default: "" },
    tabsVsSpaces: { type: String, default: "" },
    coffeeWhileCoding: { type: String, default: "" },
  },
  { timestamps: true }
);

if (mongoose.models.UserProfileDetail) {
  delete mongoose.models.UserProfileDetail;
}

const UserProfileDetail = mongoose.model("UserProfileDetail", userProfileDetailSchema);
export default UserProfileDetail;
