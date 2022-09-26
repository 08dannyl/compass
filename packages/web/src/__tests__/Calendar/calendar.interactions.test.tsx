import React from "react";
import { rest } from "msw";
import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarView } from "@web/views/Calendar";
import { ENV_WEB } from "@web/common/constants/env.constants";
import { render } from "@web/__tests__/__mocks__/mock.render";
import { server } from "@web/__tests__/__mocks__/server/mock.server";

it("displays alert upon server error", async () => {
  server.use(
    rest.get(`${ENV_WEB.API_BASEURL}/event`, (req, res, ctx) => {
      return res(
        ctx.status(500),
        ctx.json({
          error: "something broke",
        })
      );
    })
  );

  const alertMock = jest.spyOn(window, "alert").mockImplementation();
  const consoleLogMock = (console.log = jest.fn()); // mock so doesnt clutter test logs

  render(<CalendarView />);

  await waitFor(() => {
    expect(alertMock).toHaveBeenCalledTimes(1);
  });
  expect(consoleLogMock).toHaveBeenCalledTimes(1);
});

describe("Calendar Interactions", () => {
  describe("Now Line + Today Button", () => {
    it("appear/disappear when viewing future or past week", async () => {
      const user = userEvent.setup();
      render(<CalendarView />);

      /* current week */
      const todayBtn = screen.queryByText(/today/i);
      const nowLine = screen.queryByRole("separator", { name: /now line/i });

      expect(todayBtn).not.toBeInTheDocument();
      expect(nowLine).toBeInTheDocument();

      /* future week */
      await user.click(
        screen.getByRole("navigation", {
          name: /next week/i,
        })
      );

      expect(screen.getByText(/today/i)).toBeInTheDocument();
      expect(nowLine).not.toBeInTheDocument();

      /* past week */
      await user.click(screen.getByText(/today/i));

      await user.click(
        screen.getByRole("navigation", {
          name: /previous week/i,
        })
      );

      expect(screen.getByText(/today/i)).toBeInTheDocument();
      expect(nowLine).not.toBeInTheDocument();
    });
  });
});
