
import React from "react";
import { Calendar, Gift, Trophy } from "lucide-react";

const WelcomeInfoBox = () => (
  <>
    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
      <h3 className="font-semibold text-lg mb-4 text-blue-900">What you need to know:</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span className="text-blue-800"><strong>Deadline:</strong> 27 October</span>
        </div>
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 text-blue-600" />
          <span className="text-blue-800"><strong>Reward:</strong> RMIT gift for your contribution</span>
        </div>
        <div className="flex items-start gap-3">
          <Trophy className="h-5 w-5 text-blue-600 mt-0.5" />
          <span className="text-blue-800"><strong>Showcase:</strong> Your video will be featured in our Wall of High Achievers</span>
        </div>
      </div>
    </div>
    <div className="bg-gray-50 p-6 rounded-lg">
      <p className="text-gray-700 leading-relaxed">
        We'll guide you through creating a short video (max 2 minutes) showcasing your innovative 
        teaching practices. This is your opportunity to share how you're making a difference in 
        student learning and inspire your colleagues.
      </p>
    </div>
  </>
);

export default WelcomeInfoBox;
