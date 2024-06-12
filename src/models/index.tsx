import { model, models } from "mongoose";
import { MintDataSchema } from "./mint";
const MintData = models.FileData || model("FileData", MintDataSchema);

export{
    MintData
}